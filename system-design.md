# Trucker Trip Planner: System Design

This system automates FMCSA-compliant trip planning by overlaying Hours of Service (HOS) logic onto geospatial routing data. It transforms a simple route into a legal, minute-by-minute driver timeline.

---

## Requirements

### Functional Requirements (FRs)

- **Geospatial Processing:** Convert human-readable addresses into coordinates and fetch optimized truck routing.
- **HOS Simulation Engine:** A deterministic "Timeline Builder" that injects mandatory breaks (30-min), rest (10-hr), and restarts (34-hr) based on driving time and the 14-hour window.
- **Dynamic Stop Annotation:** Automatically calculate and flag fuel stops (every 1,000 miles) and rest locations.
- **Log Sheet Generation:** Construct a 24-hour grid data structure for each day of the trip, calculating totals for Off-Duty, Driving, and On-Duty statuses.
- **Interactive Visualization:** Render the route on a map and provide a visual representation of the standard FMCSA graph.

### Non-Functional Requirements (NFRs)

- **Accuracy:** HOS calculations must strictly follow the "Property-carrying, solo" rules provided; a 1-minute error can result in a "Form & Manner" violation in a real-world context.
- **Low Latency Simulation:** The backend should process a 2,000-mile trip simulation (multiple days) in under 2 seconds.
- **Printability:** The log sheet outputs must maintain visual fidelity when printed or exported as a PDF.
- **Statelessness:** The initial version will not store trips; each request is a fresh simulation based on the input payload.

---

## Core HOS Logic Assumptions

| Rule | Constraint |
|------|------------|
| **11-Hour Rule** | Max 11 hours of cumulative driving per shift. |
| **14-Hour Rule** | A driver cannot drive past the 14th consecutive hour after coming On-Duty. |
| **10-Hour Rule** | 10 consecutive hours Off-Duty resets the 11 and 14-hour counters. |
| **30-Minute Rule** | A 30-minute break is required after 8 hours of cumulative driving. |
| **70-Hour Rule** | Total On-Duty + Driving time cannot exceed 70 hours in an 8-day rolling window. A 34-hour Off-Duty period resets this cycle. |
| **Movement Math** | Fixed average speed of 55 mph is used to convert route distances into time durations. |

---

## Preliminary Request Flow

1. **Input:** User provides locations and current cycle hours.
2. **Route Acquisition:** Backend queries OpenRouteService for distance and time.
3. **Timeline Simulation:**
   - The engine starts a "Virtual Clock."
   - It "drives" the route miles, checking every mile: Is the 14-hour window closing? Is the 11-hour drive limit hit? Is it time for a 30-min break?
   - It logs every state change (Driving → Off Duty) into a master timeline.
4. **Daily Partitioning:** The master timeline is chopped into 24-hour chunks (Midnight to Midnight) to generate individual log sheets.

---

## System Architecture

The architecture is built around a **Single-Pass Simulation** pattern. Because HOS rules are chronological and cumulative, the backend must simulate the trip second-by-second to identify where violations or required breaks occur.

### Request Flow (The Simulation Path)

1. **Geocoding & Routing:** The API receives the three addresses and hits OpenRouteService (ORS) to get coordinates and a high-resolution Polyline.
2. **The "Virtual Driver" Simulation:**
   - The engine initializes a `DriverState` object (hours worked, current location, time of day).
   - **Driving Loop:** The engine "consumes" the route miles at 55 mph.
   - **Interrupts:** Every time a limit is reached (e.g., 11th driving hour), the engine pauses driving, inserts a 10-hour `OFF_DUTY` event, and resumes.
3. **Daily Log Slicing:** The continuous timeline (which could be 72+ hours) is sliced at every `00:00:00` timestamp. The engine calculates total hours per status for each calendar day.
4. **Payload Delivery:** The frontend receives a GeoJSON for the map and a "Log Array" for the UI.

---

## Core Components

### 1. Geocoding + Routing Layer

This layer acts as the foundational data provider, converting user intent (addresses) into precise geospatial coordinates and distance/time metrics.

#### Functional Workflow

- **Address Resolution:** The backend receives three string inputs (Current, Pickup, Dropoff) and uses the ORS Geocoding API to retrieve lat/lng pairs.
- **HGV Route Fetching:** The system specifically requests the `driving-hgv` profile, ensuring the route respects truck-specific constraints (bridge heights, weight limits).
- **Coordinate Chain Construction:**
  - Leg 1: Current Location → Pickup Location
  - Leg 2: Pickup Location → Dropoff Location
- **Geometry Extraction:** The GeoJSON polyline is extracted for frontend map rendering.
- **Caching Strategy:** Geocoded addresses are stored in a local cache (Redis or DB), allowing instant retrieval if the user adjusts trip parameters without changing locations.

#### Design Decisions

- **Why OpenRouteService?** It offers a robust free tier with a dedicated HGV profile. Using a standard car routing API would result in illegal and impossible trip plans.
- **Why Cache Geocodes?** Geocoding results for cities are relatively static. Caching prevents unnecessary API consumption and speeds up the "re-plan" loop.
- **Why Separate Legs?** Fetching the route in segments allows us to accurately identify the exact timestamp the driver arrives at the Pickup point, enabling the HOS engine to "park" the simulation for exactly 1 hour of On-Duty time before the final transit leg.

---

### 2. HOS Rules Engine (The Logic Core)

This component is the "brain" of the application — a stateless service that takes raw route data and simulates a driver's journey while enforcing strict FMCSA compliance.

#### Functional Workflow

**Clock Initialization:** The engine sets up four overlapping clocks:

| Clock | Tracks |
|-------|--------|
| 11-Hour Drive Clock | Cumulative driving time since last 10-hour rest |
| 14-Hour Duty Window | Non-stop timer from the moment the driver goes on-duty |
| 8-Hour Break Clock | Driving time since last 30-minute break |
| 70-Hour / 8-Day Cycle | Total on-duty/driving time over a rolling window |

**Incremental Simulation:** The engine moves through trip miles at 55 mph. At every simulated minute, it evaluates all clocks against legal limits.

**Constraint Injection:** When a limit is hit, the engine pauses movement and injects a mandatory event:

| Trigger | Action |
|---------|--------|
| 11-hour or 14-hour limit reached | Inject 10-hour `OFF_DUTY` block |
| 8-hour driving limit reached | Inject 30-minute `OFF_DUTY` block |
| 70-hour weekly limit reached | Inject 34-hour restart |

**Event Finalization:** Once the simulation reaches the Dropoff location, it adds the final 1-hour unloading task and closes the timeline.

#### Design Decisions

- **Why Fixed Speed (55 mph)?** Eliminates the volatility of real-time traffic data, providing a conservative and predictable plan with a built-in safety buffer.
- **Why a "Simulation" Approach vs. Simple Division?** HOS rules are non-linear. A 30-minute break counts against the 14-hour window but not the 11-hour drive clock. Simulating minute-by-minute is the only way to accurately capture these nested timers.
- **Why Stateless?** Treating the engine as a pure function (Inputs → Timeline) keeps the backend scalable and allows rapid "what-if" scenarios without database state.

---

### 3. Timeline Builder

The Timeline Builder is the serialization layer that converts raw HOS Engine decisions into a chronological, continuous stream of events.

#### Functional Workflow

- **Event Anchoring:** Takes the starting timestamp and anchors the first event — the 1-hour Pickup — to that date and time.
- **Chronological Sequencing:** Iterates through the HOS Engine's output, cumulatively adding each segment's duration to the "Master Clock."
- **Metadata Enrichment:** For every event, attaches:
  - **Location Context:** Nearest city or coordinate name (e.g., "Rest Stop: Near Omaha, NE")
  - **Status Mapping:** Internal states mapped to FMCSA-compliant statuses (`OFF_DUTY`, `SLEEPER_BERTH`, `DRIVING`, `ON_DUTY_NOT_DRIVING`)
- **Continuous Continuity:** Ensures zero gaps in time — if one event ends at `14:30:00`, the next starts at exactly `14:30:00` to satisfy ELD auditing standards.
- **Time Zone Display:** Log sheets display in the driver's home terminal time zone (stored in the User profile).

#### Design Decisions

- **Why UTC Storage with Local Offset?** All timeline math is performed in UTC to avoid errors with Daylight Savings or time zone crossings. Local time is only calculated during final log sheet rendering.
- **Why an "Event Stream" Model?** Storing the trip as a list of state changes is far more lightweight than storing every minute of the day, allowing a tiny JSON payload to represent several days of activity.
- **Why Assign Locations to Remarks?** FMCSA rules require a "Remark" for every change in duty status. Pre-populating these ensures the Remarks section is automatically filled with context.

---

### 4. Time Zone and Local Offset Strategy

#### Functional Workflow

- **Home Terminal Standard:** Per FMCSA regulation 395.8, all log sheets must be rendered using the time standard of the Home Terminal (Origin), even if the driver crosses multiple time zones.
- **UTC Synchronization:** The HOS Rules Engine performs all duration math and limit checks in UTC, preventing errors during Daylight Savings transitions.
- **Local Offset Application:** The Daily Log Generator identifies the UTC offset of the `current_location` at trip start. This fixed offset is applied across the entire timeline to slice segments into "Home Terminal Days."
- **UI Feedback:** The Log Sheet Renderer explicitly displays the home terminal time zone (e.g., "All times reflect Central Standard Time").

#### Design Decisions

- **Why Origin Time Zone?** FMCSA requires consistency with the driver's home terminal to simplify hour-tracking. Switching time zones mid-trip would make it impossible to verify the 24-hour total.
- **Why UTC for Math?** Using local time leads to "phantom hours" (e.g., gaining an hour when driving west). UTC calculation ensures the 11-hour and 14-hour limits are physically accurate.
- **Cross-Country Scaling:** Anchoring `DailyLog` slices to the origin offset keeps the system resilient for 3,000-mile trips spanning four time zones, maintaining a perfectly continuous 24.0-hour day for every log sheet.

---

### 5. Daily Log Generator

This component takes the continuous timeline and partitions it into standard 24-hour calendar days (Midnight to Midnight), preparing data for the FMCSA-compliant grid visualization.

#### Functional Workflow

- **Midnight Partitioning:** If an event (e.g., a 10-hour rest) spans across midnight, it is split into two segments: one ending at `23:59:59` and the next starting at `00:00:00`.
- **Grid Segment Mapping:** Each calendar day's timeline is converted into "grid-ready" objects representing status lines on the 24-hour graph.
- **Status Totals Calculation:** For every 24-hour period, total minutes are summed for each of the four categories:
  - Off Duty
  - Sleeper Berth
  - Driving
  - On Duty (Not Driving)
- **Remark Aggregation:** Location-based duty changes are collected and formatted into a "Remarks" list for the log sheet.

#### Design Decisions

- **Why Split Events at Midnight?** A driver's 10-hour sleep from 10 PM to 8 AM must show 2 hours on Day 1 and 8 hours on Day 2 to be legally compliant.
- **Why Calculate Totals in the Backend?** Ensures "Total Hours" (which must equal exactly 24.0) are calculated using the same precision as the HOS Rules Engine, preventing rounding discrepancies.
- **Why Fixed Log Structure?** Even if a driver is Off-Duty for an entire 24-hour period, the generator must still produce a "blank" log sheet to satisfy the legal requirement for a continuous record of duty status.

---

### 6. Map Renderer (Frontend)

This component transforms the backend's GeoJSON and stop data into an interactive, annotated map.

#### Functional Workflow

- **Route Visualization:** The GeoJSON polyline is drawn as a bold, high-contrast line across the map.
- **Smart Marker Placement:** Custom markers for each stop type:
  - **Origin/Destination:** Distinct icons for current location and dropoff point
  - **Pickup:** Specific icon indicating the 1-hour loading window
  - **Regulatory Stops:** Icons for 10-hour rest breaks and 30-minute breaks
  - **Operational Stops:** Fuel icons at 1,000-mile markers
- **Interactive Tooltips:** Every marker reveals a popup with: type of stop, estimated arrival time, and planned duration.
- **Bounds Fitting:** On load, the map automatically zooms and pans to show the entire route.

#### Design Decisions

- **Why Leaflet/MapLibre?** Lightweight and highly customizable, allowing easy manipulation of SVG-based markers and polylines.
- **Why Custom Stop Icons?** In logistics, the reason for a stop is as important as the location. Different icons for "Fuel" vs. "Rest" let the driver scan the trip plan at a glance.
- **Why Decouple Map from Logs?** The map remains static while the user tabs through daily log sheets, allowing the "Big Picture" route to stay visible while inspecting daily details.

---

### 7. Log Sheet Renderer (Frontend)

This component transforms sliced daily data into a professional, FMCSA-compliant 24-hour grid using a high-fidelity SVG template.

#### Functional Workflow

- **Grid Construction:** A coordinate system representing a 24-hour day:
  - **X-Axis:** 24 columns (one per hour), subdivided into 15-minute intervals
  - **Y-Axis:** 4 rows for standard duty statuses (`OFF_DUTY`, `SLEEPER_BERTH`, `DRIVING`, `ON_DUTY_NOT_DRIVING`)
- **Dynamic Line Drawing:** For each segment, a horizontal line is drawn in the corresponding status row, with vertical "connector" lines at every status change.
- **Header & Totals Injection:** Populates metadata fields:
  - Left: Driver name, date, and carrier info
  - Right: Calculated total hours per row (e.g., "Driving: 11.0")
  - Bottom: Remarks listing locations and timestamps for every duty change
- **Tabbed Navigation:** A tabbed interface (e.g., "Day 1", "Day 2", "Day 3") allows the user to switch between individual log sheets.

#### Design Decisions

- **Why SVG over HTML Tables?** SVG allows absolute coordinate placement, ensuring sharp, perfectly aligned lines that scale regardless of screen resolution. HTML tables cannot draw the continuous "stepped" line required by the FMCSA.
- **Why CSS Print Styles?** Using `@media print` CSS, the renderer hides navigation tabs and resizes the SVG log sheet to fit on a standard 8.5" × 11" sheet.
- **Why 15-Minute Snapping?** While the simulation runs in minutes, the visual grid snaps to 15-minute increments for readability. The totals column still reflects exact minute-based math from the backend.

---

## Business Rules (Regulatory Logic)

### A. Shift Constraints (Property-Carrying Solo Driver)

| Rule | Constraint | System Action |
|------|------------|---------------|
| **11-Hour Limit** | Max 11 cumulative hours of Driving per shift | Inject 10-hour `OFF_DUTY` block |
| **14-Hour Window** | No driving after the 14th consecutive hour since going On-Duty | Inject 10-hour `OFF_DUTY` block |
| **8-Hour Break** | 30-min break required after 8 hours of cumulative driving | Inject 30-minute `OFF_DUTY` block |
| **10-Hour Rest** | Minimum 10 consecutive hours off-duty | Resets the 11h and 14h counters |

### B. Cycle Constraints (Weekly)

| Rule | Constraint | System Action |
|------|------------|---------------|
| **70-Hour Rule** | Max 70 hours of (Driving + On-Duty) in any 8-day period | Simulation paused |
| **34-Hour Restart** | 34 consecutive hours of Off-Duty time | Resets the 70-hour cycle pool to zero |

### C. Operational Constants

| Status | Use Case | Impact on Clocks |
|--------|----------|-----------------|
| `OFF_DUTY` | 30-min breaks / pre-trip | Pauses 11h/14h clocks; resets 70h cycle if ≥ 34h |
| `SLEEPER_BERTH` | 10-hour overnights | Resets 11h Drive and 14h Duty window counters |
| `DRIVING` | Active transit | Consumes 11h, 14h, and 70h clocks |
| `ON_DUTY_ND` | Pickup / dropoff / fuel | Consumes 14h and 70h clocks; 11h clock remains static |

**Simulation Defaults:**

| Constant | Value |
|----------|-------|
| Average Driving Speed | 55 mph |
| Pickup Duration | 1 hour (`ON_DUTY_NOT_DRIVING`) |
| Dropoff Duration | 1 hour (`ON_DUTY_NOT_DRIVING`) |
| Fuel Stop Frequency | Every 1,000 miles |
| Fuel Stop Duration | 30 minutes (`ON_DUTY_NOT_DRIVING`) |

### D. Logical Priority (Resolution Order)

When multiple rules trigger simultaneously, the engine applies the most restrictive rest period first:

1. 34-Hour Restart *(highest priority)*
2. 10-Hour Rest
3. 30-Minute Break *(lowest priority)*

> **Example:** If a driver hits their 11-hour drive limit and the 70-hour cycle limit simultaneously, the engine injects 34 hours of rest, which naturally satisfies the 10-hour requirement.

---

## Database Schema

The database is optimized for two roles: caching expensive API results and providing persistence for users to retrieve historical trip logs.

### Core Data Models

| Table | Key Fields | Purpose |
|-------|------------|---------|
| `Users` | `id`, `username`, `email`, `carrier_name`, `license_no` | Profile data for populating log sheet headers |
| `GeocodeCache` | `address_hash` (PK), `lat`, `lng`, `display_name` | Caches ORS geocoding results to minimize API hits |
| `Trips` | `id`, `user_id`, `start_time`, `origin`, `destination`, `total_miles` | Header info for a saved trip simulation |
| `TripSegments` | `trip_id`, `status`, `start_time`, `end_time`, `location_text` | Raw timeline events used to rebuild log sheets |
| `DailyLogs` | `id`, `trip_id`, `date`, `total_off_duty`, `total_driving` | Aggregated daily totals for fast dashboard rendering |

### Model Relationships

- **One-to-Many (Users → Trips):** A single driver can have multiple planned routes.
- **One-to-Many (Trips → TripSegments):** A single trip is composed of dozens of duty status changes.
- **One-to-Many (Trips → DailyLogs):** A multi-day trip is partitioned into distinct 24-hour records.

### Design Decisions

- **Why a `GeocodeCache` table?** Using a hash of the input string as a primary key allows O(1) coordinate retrieval, bypassing external network calls entirely for common routes.
- **Why store `TripSegments` separately?** Breaking the timeline into a relational table allows granular querying (e.g., "Show me all driving segments across all trips") and easier integration with reporting tools.
- **Why `DecimalField` for hours?** In HOS logging, 0.25 hours (15 minutes) is a standard increment. Floating-point numbers can produce rounding errors (e.g., `0.1 + 0.2 ≠ 0.3`) that could invalidate a legal log sheet. `Decimal(10, 2)` ensures exact precision.

---

## API Contract

### Trip Planning Endpoint

**`POST /api/trip/plan`**

This is the primary endpoint that triggers the Geocoding, Routing, and HOS Engines.

#### Request Body

```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "St. Louis, MO",
  "dropoff_location": "Dallas, TX",
  "cycle_hours_used": 24.5,
  "start_time": "2026-04-23T08:00:00Z"
}
```

#### Response Body (200 OK)

```json
{
  "trip_id": "uuid-12345",
  "summary": {
    "total_miles": 850,
    "total_duration_hrs": 32.5,
    "eta": "2026-04-24T16:30:00Z"
  },
  "route": {
    "geojson": { "type": "Feature", "geometry": { "type": "LineString", "coordinates": [] } }
  },
  "stops": [
    {
      "type": "FUEL_STOP",
      "location": "Joplin, MO",
      "arrival": "2026-04-23T14:00:00Z",
      "duration_min": 30
    }
  ],
  "daily_logs": [
    {
      "date": "2026-04-23",
      "segments": [
        { "status": "DRIVING", "start": "08:00", "end": "12:00", "duration_hrs": 4.0 },
        { "status": "OFF_DUTY", "start": "12:00", "end": "12:30", "duration_hrs": 0.5 }
      ],
      "totals": {
        "off_duty": 11.5,
        "driving": 11.0,
        "on_duty": 1.5
      },
      "remarks": [
        { "time": "08:00", "note": "Start Trip - Chicago, IL" }
      ]
    }
  ]
}
```

#### Design Decisions

- **Why return `daily_logs` as a pre-sliced array?** Prevents the frontend from implementing complex midnight-splitting logic. The React app can simply iterate and render one `LogSheet` component per entry.
- **Why include `total_miles` and `eta` in a `summary` object?** Allows the UI to display a "Quick Stats" bar without parsing the entire GeoJSON or timeline array.
- **Why use ISO 8601 for timestamps?** Industry standard for time-zone-aware calculations. The `Z` suffix ensures backend and frontend stay synchronized on UTC before local offsets are applied.

---

## Error Handling & Resilience

### A. Categorized Error Strategy

| Category | Scenario | System Response |
|----------|----------|-----------------|
| **Geospatial Error** | Address cannot be geocoded | `400 Bad Request`: `{"field": "pickup_location", "message": "Address not found"}` |
| **Routing Error** | No HGV-accessible road exists between locations | `422 Unprocessable Entity`: `{"error": "No viable truck route found"}` |
| **HOS Logic Error** | `cycle_hours_used` is > 70 or negative | `400 Bad Request`: Prevents simulation from running on impossible data |
| **API Rate Limit** | OpenRouteService free tier limit reached | `503 Service Unavailable`: Implements `Retry-After` header and user-facing alert |

### B. Resilience Mechanisms

- **Simulation Fallbacks:** If the Routing API fails to provide a duration but provides a distance, the engine falls back to Safe Calculation Mode using `Distance / 55 mph`.
- **Circuit Breaker for External APIs:** If ORS is down or timing out, the system trips a circuit breaker for 30 seconds, serving a "System Maintenance" message instead of a 60-second timeout.
- **Atomic Log Generation:** The Daily Log Generator includes a "Consistency Check." If the total hours for a day do not sum to exactly 24.00, the entire simulation is rejected rather than displaying a legally dangerous log sheet.

### C. Design Decisions

- **Why specific field errors for Geocoding?** In a 3-field form, pointing specifically to `pickup_location` allows the user to fix the error instantly.
- **Why a `422` for Routing?** Distinguishes between "I don't know where that is" (`400`) and "I can't get there by truck" (`422`).
- **Why the "24-Hour Check"?** A log summing to 23.9 or 24.1 is a serious ELD violation. This validation acts as a final safety net for the simulation logic.

---

## Docker Infrastructure and Deployment Strategy

### A. Container Orchestration

The system is decomposed into four primary services via Docker Compose:

| Service | Technology | Role |
|---------|-----------|------|
| **API Service** | Django + DRF | Handles auth, input validation, and user profile management. Submits simulation requests to Redis and polls for results. |
| **Worker Service** | Celery | Runs the `HOSScheduler` and `HOSRulesEngine`. Performs all external calls to OpenRouteService. |
| **Broker & Cache** | Redis | Dual-purpose: message broker for Celery and high-speed cache for geocoded coordinates and route geometries. |
| **Application Database** | PostgreSQL | Persistent storage for Users, Trips, and Audit Logs. |

### B. Deployment Workflow

- **Frontend (Vercel):** Deploys the React (Vite) bundle via Vercel's Edge Network for minimal latency.
- **Backend & Workers (Railway):** API and Worker deployed as separate horizontal units. If a massive routing request causes a worker to spike in memory, the API service remains unaffected.

### C. Design Decisions

- **Why a Worker Service from Day One?** HOS simulations are "heavy" compared to standard CRUD operations. Celery prevents "Head-of-Line" blocking where one user's 2,000-mile trip calculation freezes the site for everyone else.
- **Why Shared Redis?** Using Redis for both message brokering and geocode caching reduces infrastructure complexity while providing the speed the "Virtual Driver" simulation needs.
- **Why Containerization?** The HOS engine relies on specific Python math libraries. Docker ensures the "Legal Math" calculated on a developer's machine is bit-for-bit identical to production — critical for FMCSA compliance.

---

## Project Folder Structure

```
trucker-trip-planner/
├── app/
│   ├── backend/                # Django REST Framework
│   │   ├── core/               # Settings, WSGI, ASGI
│   │   ├── api/                # Viewsets, Serializers, URL Routing
│   │   ├── services/           # SRP: HOSRulesEngine, SimulationService
│   │   ├── connectors/         # OpenRouteService API Wrapper
│   │   ├── tasks/              # Celery tasks (Simulation/Routing)
│   │   └── tests/              # Pytest suites (Unit/Integration)
│   └── frontend/               # React + TypeScript + Vite
│       ├── src/
│       │   ├── assets/         # Global styles & Map markers
│       │   ├── components/     # Shared UI (Button, Input, Layout)
│       │   ├── features/       # Feature-driven modules
│       │   │   ├── planner/    # Form & Logic for trip inputs
│       │   │   ├── map/        # Map Renderer & Annotation
│       │   │   └── logs/       # Daily Log Grid (SVG) & Tabs
│       │   ├── hooks/          # Global hooks (useTripStatus, etc.)
│       │   └── services/       # Axios API client
│       ├── tailwind.config.js
│       └── tsconfig.json
├── .devcontainer/              # VS Code remote container config
├── scripts/                    # Database seeding & setup
├── .env.example                # Template for API keys & DB credentials
├── .gitignore                  # Exclusion list for Git
├── docker-compose.yml          # API, Worker, Redis, Postgres
├── Makefile                    # Developer shortcuts (build, test, seed)
├── mypy.ini                    # Static type checking config (Backend)
├── pytest.ini                  # Test runner configuration
└── README.md                   # Setup and HOS documentation
```

### Key Architecture Decisions

- **Backend Services (`services/`):** The Rules Engine resides here — isolated from `models.py` and `views.py` — so it can be tested without a database or network request.
- **Frontend Features (`features/`):** Keeps the Log Sheet Renderer (complex SVG logic) separate from the Map Renderer, preventing a monolithic `components` folder.
- **Root Configuration:** `Makefile` standardizes commands like `make test` or `make simulate`; `mypy.ini` ensures type safety in HOS math; `.devcontainer` provides an identical dev environment with correct Python and Node versions.

---

## Testing Strategy

Since this application involves regulatory compliance (FMCSA HOS), the testing strategy prioritizes rigorous mathematical verification over simple UI checks.

### A. Backend Testing (Pytest)

**Unit Tests ("The Rule Book"):**

| Test | Description |
|------|-------------|
| The 11-Hour Test | Feed the engine a 12-hour raw driving segment; verify it injects a 10-hour rest at exactly the 11.0-hour mark. |
| The 14-Hour Test | Feed a scenario with 5 hours of on-duty (loading) followed by 10 hours of driving; verify it stops at the 14th hour of total elapsed time. |
| The 34-Hour Restart | Simulate a 70-hour work week; verify the engine injects a 34-hour off-duty block before allowing further movement. |

**Integration Tests:**

- **ORS Mocking:** Use `pytest-mock` to intercept calls to OpenRouteService, returning pre-defined GeoJSON to test specific distances (e.g., a 1,100-mile route triggering a fuel stop).

**Property-Based Testing (Hypothesis):**

- Use the `Hypothesis` library to generate thousands of random trip durations and cycle hours, ensuring the engine never crashes and always produces a daily log total of exactly 24.0 hours.

### B. Frontend Testing (Vitest & React Testing Library)

- **SVG Grid Rendering:** Verify that a 4-hour driving segment correctly translates to an SVG `<line>` spanning 4/24ths of the grid width.
- **Print Fidelity:** Test that `@media print` CSS correctly hides navigation elements and expands the log sheet to 100% width.
- **State Sync:** Verify that switching between "Day 1" and "Day 2" tabs correctly updates the grid and the Remarks section.

### C. HOS Scenario Test Suite

A `scenarios.json` file maintains "Gold Standard" trips:

| Scenario | Description | Expected Result |
|----------|-------------|-----------------|
| **The Short Haul** | 300 miles, 1 pickup, 1 dropoff | No breaks required |
| **The Over-the-Road (OTR)** | 2,000 miles, multiple days | Multiple 10hr rests, 30m breaks, and 2 fuel stops |
| **The Cycle Reset** | 70-hour initial load | Immediate 34hr restart |

### D. Design Decisions

- **Why Mock ORS?** We cannot rely on a third-party API for unit tests. Mocking ensures tests are fast, deterministic, and don't consume API quota.
- **Why Hypothesis?** Logistics edge cases (e.g., a shift ending exactly on a leap-second or midnight) are hard to anticipate manually. Randomized testing finds these edge cases automatically.
- **Why the 24.0 Total Check?** Every test — unit or integration — must assert that `total_off + total_on + total_drive == 24.0`. This is the "North Star" metric for legal compliance.