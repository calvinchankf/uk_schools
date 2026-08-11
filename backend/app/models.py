"""
Pydantic models for API request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, List

class SchoolMetrics(BaseModel):
    # KS2 (primary) -- null for secondary schools
    ptrwm_exp: Optional[float] = Field(None, description="% at expected standard in reading/writing/maths")
    ptrwm_high: Optional[float] = Field(None, description="% at high standard")
    read_average: Optional[float] = Field(None, description="Average reading scaled score")
    mat_average: Optional[float] = Field(None, description="Average maths scaled score")
    gps_average: Optional[float] = Field(None, description="Average GPS scaled score")
    # KS4 (secondary) -- null for primary schools
    att8_score: Optional[float] = Field(None, description="Attainment 8 score")
    l2basics_94: Optional[float] = Field(None, description="% achieving grade 9-4 in English & maths")
    ebacc_94: Optional[float] = Field(None, description="% achieving EBacc at grade 9-4")
    ebacc_entry: Optional[float] = Field(None, description="% entered for EBacc")

class EthnicityGroup(BaseModel):
    group: str
    pct: float

class FeederSecondary(BaseModel):
    urn: int
    name: str
    dist_km: float

class SchoolAddress(BaseModel):
    street: str
    town: str
    locality: str

class School(BaseModel):
    urn: int
    name: str
    postcode: str
    latitude: float
    longitude: float
    school_type: str
    age_low: Optional[int]
    age_high: Optional[int]
    phase: str = "primary"
    performance_score: float
    metrics: SchoolMetrics
    address: SchoolAddress
    distance_km: Optional[float] = Field(None, description="Distance from search point in km")
    fsm_pct: Optional[float] = Field(None, description="% pupils eligible for free school meals (6-year window)")
    ethnicity: List[EthnicityGroup] = Field(default_factory=list, description="All ethnic groups with non-zero %, sorted by % descending")
    feeder_secondary: Optional[FeederSecondary] = Field(None, description="Nearest secondary school")

class SchoolSearchResponse(BaseModel):
    schools: List[School]
    count: int
    search_location: dict

class StatsResponse(BaseModel):
    total_schools: int
    score_range: dict
    score_distribution: dict
