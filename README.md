# UK Schools Search

A web application to search for nearby UK schools ranked by performance. Covers both **primary schools** (Key Stage 2) and **secondary schools** (Key Stage 4), with an interactive map interface powered by OpenStreetMap.

**Live site: [https://calvinchankf.com/uk_schools/](https://calvinchankf.com/uk_schools/)**

![demo](demo/screenshot.png)

## Features

- **Primary / Secondary Toggle**: Switch between KS2 primary schools and KS4 secondary schools
- **Interactive Map**: Click anywhere on the map to search for nearby schools
- **Postcode Search**: Enter a UK postcode to find schools in that area
- **Performance Rankings**: Schools ranked by composite performance scores
- **Adjustable Radius**: Search radius from 1-10 km
- **Color-Coded Markers**: Visual performance indicators on the map
  - Green (75+): Excellent
  - Light Green (60-74): Good
  - Yellow (45-59): Average
  - Red (<45): Below average
- **Detailed Information**: View school metrics, addresses, and distances

## Dataset

- **16,403 UK primary schools** with KS2 performance data (reading, writing, maths)
- **4,055 UK secondary schools** with KS4 performance data (Attainment 8, GCSE pass rates, EBacc)
- **Data source**: UK government education statistics 2024-2025
- **Geocoding**: postcodes.io (UK government postcode database)

## License

This project uses open government data under the Open Government Licence.
