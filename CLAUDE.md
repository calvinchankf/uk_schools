# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains UK school performance and administrative data for the 2024-2025 academic year. The data is sourced from UK government education statistics and covers England's schools across various key stages (KS2, KS4, KS5).

## Data Structure

The repository has two main directories:

### `data_2024-2025/`
Contains the primary datasets in CSV and Excel formats:
- `england_school_information.csv` - Master school directory with URN, school names, addresses, types, age ranges, and admission policies
- `england_census.csv` - School census data including pupil counts, gender distribution, free school meals (FSM), English as first language (EFL), and special educational needs (SEN)
- `england_ks2revised.csv` - Key Stage 2 (primary school) performance data
- `england_ks2-mats-performance.csv` - Multi-academy trust performance at KS2
- `england_ks4provisional.csv` - Key Stage 4 (GCSE level) provisional results
- `england_ks4-pupdest.csv` - KS4 pupil destinations after secondary school
- `england_ks4underlying_*.xlsx` - Detailed KS4 underlying data (entries and grades)
- `england_ks5-studest.csv` - Key Stage 5 (post-16) student destinations
- `england_ks5-studest-he.csv` - KS5 higher education destinations

### `metadata_2024-2025/`
Contains metadata documentation describing the data fields:
- `census_meta.csv` - Field definitions for census data
- `ks2_meta.csv` - Field definitions for KS2 data
- `ks2-mats-performance_meta.csv` - Field definitions for MATs performance
- `ks4provisional_meta.xlsx` - Field definitions for KS4 provisional data
- `ks4-pupdest_meta.csv` - Field definitions for KS4 pupil destinations
- `ks5-studest_meta.csv` - Field definitions for KS5 student destinations
- `ks5-studest-he_meta.csv` - Field definitions for KS5 HE destinations
- `la_and_region_codes_meta.csv` - Local authority and region code mappings
- `abbreviations.xlsx` - Common abbreviations used across datasets

## Key Data Identifiers

- **URN** (Unique Reference Number) - Primary identifier for schools across all datasets
- **LEA/LA** - Local Education Authority/Local Authority number
- **ESTAB** - Establishment number
- **LAESTAB** - Combined LA + ESTAB identifier

## Data Format Notes

- Some CSV files use UTF-8 with BOM encoding
- Line terminators may be CRLF (Windows-style)
- Excel files (.xlsx) contain metadata and some detailed underlying data
- Fields marked as "SUPP" indicate suppressed data (typically for privacy when counts are very small)
- "NA" indicates not applicable or not available

## Common Data Fields

### School Information
- `SCHNAME` - School name
- `SCHOOLTYPE` - Type of school (e.g., State-funded primary, Independent school, Academy)
- `NFTYPE` - National funding type codes (e.g., ACS, ACCS, CY, VC)
- `AGELOW`/`AGEHIGH` - Age range served
- `ISPRIMARY`/`ISSECONDARY`/`ISPOST16` - Education phase indicators

### Performance & Destinations
- Destination categories: `APPREN` (Apprenticeship), `EDUCATION`, `FE` (Further Education), `HE` (Higher Education), `EMPLOYMENT`, `NOT_SUSTAINED`, `UNKNOWN`
- Data is often split by disability status: `_DIS` and `_NONDIS` suffixes
- Level breakdowns: `L3` (Level 3), `L2` (Level 2), `LALLOTH` (all other levels)

### Census Data
- `NOR` - Total number on roll
- `NORG`/`NORB` - Girls/boys on roll
- `NUMFSM` - Number of pupils eligible for free school meals
- `NUMFSMEVER` - Pupils who have ever been eligible for FSM
- `NUMENGFL` - Number with English as first language
- `TSENELSE`/`TSENELK` - Special educational needs indicators

## Working with This Data

When analyzing this data:
1. Always join datasets using URN as the primary key
2. Check metadata files first to understand field definitions before querying data
3. Be aware of suppressed data (SUPP) which indicates small counts that have been hidden for privacy
4. Percentage fields typically end with `PER` suffix
5. Many datasets include historical comparisons (e.g., `_22`, `_21` suffixes for previous years)
