# SafeSus API Documentation

## MVP Description

**SafeSus** is a safety intelligence platform for travelers in Thailand. It provides real-time safety maps, community-sourced tips, and location-based warnings to help travelers stay safe.

### Core Features:

1. **SafeMap**: Color-coded safety zones (Safe, Watch, Avoid) for cities

2. **SafeAlert**: Real-time safety tips and warnings from the community

3. **Live Mode**: Location-based alerts for nearby safety issues (within 500m)

4. **City Coverage**: Currently supports Bangkok (alpha), with Phuket and Chiang Mai coming soon

5. **Community Contributions**: Users can submit safety tips, pins (scam/incident locations), and zones

### Key Concepts:

- **Zones**: Geographic areas with safety levels (recommended, neutral, caution, avoid)

- **Pins**: Specific location markers for scams, harassment, overcharging, or other incidents

- **Tips**: Safety advice and information submitted by travelers

- **Cities**: Supported destinations with safety data

---

## Base URL

```
Production: https://safesus.com/api
Development: http://localhost:3000/api
```

---

## Authentication

Most endpoints are public. Some require authentication via Supabase Auth:

- **Header**: `Authorization: Bearer <supabase_access_token>`
- **Auth Methods**: Email/Password or Google OAuth (via Supabase)
- **Guest Mode**: Some endpoints allow guest submissions with a `guest_name` field

---

## API Endpoints

### 1. Get All Cities

Get a list of all supported cities.

**Endpoint**: `GET /api/cities`

**Authentication**: Not required

**Response**:
```json
{
  "cities": [
    {
      "id": 1,
      "name": "Bangkok",
      "slug": "bangkok",
      "country": "Thailand",
      "supported": true
    }
  ]
}
```

**Example**:

```bash
curl https://safesus.com/api/cities
```

---

### 2. Get City Details

Get complete city data including zones, pins, tips, reports, incidents, and rules.

**Endpoint**: `GET /api/city/[slug]`

**Authentication**: Not required

**Path Parameters**:

- `slug` (string): City slug (e.g., "bangkok")

**Response**:

```json
{
  "city": {
    "id": 1,
    "name": "Bangkok",
    "slug": "bangkok",
    "country": "Thailand",
    "supported": true,
    "zones": [
      {
        "id": 1,
        "city_id": 1,
        "label": "Sukhumvit",
        "level": "recommended",
        "reason_short": "Generally safe",
        "reason_long": "Well-lit, tourist-friendly area",
        "geom": {
          "type": "Polygon",
          "coordinates": [[[lng, lat], ...]]
        }
      }
    ],
    "pins": [
      {
        "id": 1,
        "city_id": 1,
        "type": "scam",
        "title": "Tuk-tuk scam",
        "summary": "Overcharging tourists",
        "details": "Avoid tuk-tuks near Grand Palace",
        "location": {
          "type": "Point",
          "coordinates": [100.5018, 13.7563]
        },
        "status": "approved",
        "source": "user"
      }
    ],
    "tips": [
      {
        "id": 1,
        "title": "Use Grab for taxis",
        "summary": "Grab app is safer than street taxis",
        "category": "transportation",
        "location": {
          "type": "Point",
          "coordinates": [100.5018, 13.7563]
        }
      }
    ],
    "reports": [],
    "incidents": [],
    "rules": []
  }
}
```

**Example**:

```bash
curl https://safesus.com/api/city/bangkok
```

---

### 3. Get Nearby Safety Data (Live Mode)

Get safety zones and nearby pins based on current location.

**Endpoint**: `GET /api/live/nearby`

**Authentication**: Not required

**Query Parameters**:

- `lat` (number, required): Latitude
- `lng` (number, required): Longitude
- `cityId` (number, optional): Filter by city ID

**Response**:

```json
{
  "zones": [
    {
      "id": 1,
      "city_id": 1,
      "label": "Sukhumvit",
      "level": "recommended",
      "geom": { "type": "Polygon", "coordinates": [...] }
    }
  ],
  "nearbyPins": [
    {
      "id": 1,
      "city_id": 1,
      "type": "scam",
      "title": "Tuk-tuk scam",
      "summary": "Overcharging tourists",
      "details": "Avoid tuk-tuks near Grand Palace",
      "location": {
        "type": "Point",
        "coordinates": [100.5018, 13.7563]
      },
      "distance": 250,
      "status": "approved"
    }
  ]
}
```

**Example**:

```bash
curl "https://safesus.com/api/live/nearby?lat=13.7563&lng=100.5018&cityId=1"
```

**Note**: Returns pins within 500m radius using PostGIS.

---

### 4. Get Recent Tips

Get the most recent approved safety tips.

**Endpoint**: `GET /api/recent-tips`

**Authentication**: Not required

**Response**:

```json
{
  "tips": [
    {
      "id": 1,
      "title": "Use Grab for taxis",
      "tip_category": "transportation",
      "city_name": "Bangkok",
      "city_slug": "bangkok",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Example**:

```bash
curl https://safesus.com/api/recent-tips
```

---

### 5. Search Tips

Search safety tips by keyword.

**Endpoint**: `GET /api/search-tips`

**Authentication**: Not required

**Query Parameters**:

- `q` (string, required): Search query (minimum 2 characters)

**Response**:

```json
{
  "results": [
    {
      "id": 1,
      "title": "Grab taxi app",
      "summary": "Use Grab instead of street taxis",
      "tip_category": "transportation",
      "city_name": "Bangkok",
      "city_slug": "bangkok"
    }
  ]
}
```

**Example**:

```bash
curl "https://safesus.com/api/search-tips?q=taxi"
```

---

### 6. Submit Safety Tip

Submit a new safety tip for review.

**Endpoint**: `POST /api/submit-tip`

**Authentication**: Required (Bearer token)

**Request Body**:

```json
{
  "city_id": 1,
  "category": "transportation",
  "title": "Use Grab for taxis",
  "summary": "Grab app is safer and more reliable",
  "details": "Download the Grab app to avoid overcharging",
  "location": {
    "type": "Point",
    "coordinates": [100.5018, 13.7563]
  },
  "occurred_at": "2024-01-15T10:30:00Z"
}
```

**Categories**:

- `transportation`
- `shopping`
- `dining`
- `accommodation`
- `general_safety`
- `attractions`
- `cultural`
- `communication`
- `money`

**Response**:

```json
{
  "success": true,
  "submission": {
    "id": 123,
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Example**:

```bash
curl -X POST https://safesus.com/api/submit-tip \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "city_id": 1,
    "category": "transportation",
    "title": "Use Grab for taxis",
    "summary": "Grab app is safer",
    "location": {
      "type": "Point",
      "coordinates": [100.5018, 13.7563]
    }
  }'
```

---

### 7. Submit Pin (Scam/Incident Location)

Submit a location-specific safety pin (scam, harassment, overcharge, etc.).

**Endpoint**: `POST /api/submit-pin`

**Authentication**: Required (or guest mode with `guest_name`)

**Request Body**:

```json
{
  "type": "scam",
  "title": "Tuk-tuk scam",
  "summary": "Overcharging tourists",
  "details": "Avoid tuk-tuks near Grand Palace",
  "location": {
    "type": "Point",
    "coordinates": [100.5018, 13.7563]
  },
  "guest_name": "John Doe"  // Optional, for guest submissions
}
```

**Pin Types**:

- `scam`
- `harassment`
- `overcharge`
- `other`

**Response**:

```json
{
  "success": true,
  "message": "Pin submitted successfully for review.",
  "data": {
    "id": 123,
    "status": "pending"
  }
}
```

**Example**:

```bash
curl -X POST https://safesus.com/api/submit-pin \
  -H "Content-Type: application/json" \
  -d '{
    "type": "scam",
    "title": "Tuk-tuk scam",
    "summary": "Overcharging tourists",
    "location": {
      "type": "Point",
      "coordinates": [100.5018, 13.7563]
    }
  }'
```

---

### 8. Save City

Save a city to user's saved list.

**Endpoint**: `POST /api/save`

**Authentication**: Required

**Request Body**:

```json
{
  "city_id": 1
}
```

**Response**:

```json
{
  "success": true
}
```

**Example**:

```bash
curl -X POST https://safesus.com/api/save \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"city_id": 1}'
```

---

### 9. Unsave City

Remove a city from user's saved list.

**Endpoint**: `DELETE /api/save`

**Authentication**: Required

**Request Body**:

```json
{
  "city_id": 1
}
```

**Response**:

```json
{
  "success": true
}
```

---

### 10. Get Notifications

Get user's notifications.

**Endpoint**: `GET /api/notifications`

**Authentication**: Required

**Query Parameters**:

- `unreadOnly` (boolean, optional): Filter unread only
- `limit` (number, optional): Limit results (default: 50)

**Response**:

```json
{
  "notifications": [
    {
      "id": 1,
      "user_id": "user-uuid",
      "type": "tip_approved",
      "title": "Your tip was approved",
      "message": "Your safety tip has been published",
      "is_read": false,
      "link": "/city/bangkok",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "unreadCount": 2
}
```

**Example**:

```bash
curl "https://safesus.com/api/notifications?unreadOnly=true" \
  -H "Authorization: Bearer <token>"
```

---

### 11. Mark Notification as Read

Mark a specific notification as read.

**Endpoint**: `PATCH /api/notifications/[id]`

**Authentication**: Required

**Path Parameters**:

- `id` (number): Notification ID

**Response**:

```json
{
  "success": true
}
```

---

### 12. Mark All Notifications as Read

Mark all user notifications as read.

**Endpoint**: `POST /api/notifications/mark-all-read`

**Authentication**: Required

**Response**:

```json
{
  "success": true
}
```

---

### 13. Get Waitlist Count

Get the current waitlist signup count.

**Endpoint**: `GET /api/waitlist-count`

**Authentication**: Not required

**Response**:

```json
{
  "count": 1234
}
```

**Example**:

```bash
curl https://safesus.com/api/waitlist-count
```

**Note**: Cached for 5 minutes.

---

## Data Models

### Zone

```tsx
{
  id: number;
  city_id: number;
  label: string;
  level: "recommended" | "neutral" | "caution" | "avoid";
  reason_short: string;
  reason_long: string | null;
  geom: GeoJSON.Polygon;
  verified_by: string | null;
  created_at: string;
}
```

### Pin

```tsx
{
  id: number;
  city_id: number;
  type: "scam" | "harassment" | "overcharge" | "other";
  title: string;
  summary: string;
  details: string | null;
  location: GeoJSON.Point;
  status: "approved" | "pending" | "rejected";
  source: "curated" | "user";
  created_at: string;
}
```

### Tip

```tsx
{
  id: number;
  user_id: string | null;
  city_id: number | null;
  category: TipCategory;
  title: string;
  summary: string;
  details: string | null;
  location: GeoJSON.Point | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}
```

### City

```tsx
{
  id: number;
  name: string;
  slug: string;
  country: string;
  supported: boolean;
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

**Common Status Codes**:

- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

---

## GeoJSON Format

All location data uses GeoJSON:

**Point**:

```json
{
  "type": "Point",
  "coordinates": [longitude, latitude]
}
```

**Polygon** (for zones):

```json
{
  "type": "Polygon",
  "coordinates": [[[lng1, lat1], [lng2, lat2], [lng3, lat3], [lng1, lat1]]]
}
```

**Note**: Coordinates are in `[longitude, latitude]` order (GeoJSON standard).

---

## Rate Limiting

- Public endpoints: 100 requests/minute per IP
- Authenticated endpoints: 200 requests/minute per user
- Submission endpoints: 10 requests/minute per user

---

## Notes for Mobile App Development

1. **Location Services**: Use device GPS for live mode (`/api/live/nearby`)
2. **Offline Support**: Cache city data and zones for offline viewing
3. **Real-time Updates**: Poll `/api/recent-tips` every 5 minutes for new tips
4. **Map Integration**: Use Mapbox GL or similar to render zones and pins
5. **Authentication**: Integrate Supabase Auth SDK for mobile
6. **Push Notifications**: Use `/api/notifications` to check for new alerts
7. **Guest Mode**: Allow pin submissions without account (use `guest_name`)

---

## Example Mobile App Flow

1. **Onboarding**: Fetch cities (`GET /api/cities`)
2. **City Selection**: Get city details (`GET /api/city/[slug]`)
3. **Map View**: Display zones and pins from city data
4. **Live Mode**: Continuously call `/api/live/nearby` with user location
5. **Tip Submission**: Allow users to submit tips (`POST /api/submit-tip`)
6. **Notifications**: Poll `/api/notifications` for updates

---

This document should be sufficient to build a mock mobile application that integrates with the SafeSus API.

