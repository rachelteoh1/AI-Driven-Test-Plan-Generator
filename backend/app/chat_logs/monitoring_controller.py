from fastapi import APIRouter
from starlette import status
from . import models
from . import monitoring_service

router = APIRouter(
    prefix='/monitoring',
    tags=['Monitoring']
)

@router.get("/health", response_model=models.HealthResponse)
async def health_check():
    """
    Health check endpoint to verify system status
    
    Returns:
        - status: Overall system health status
        - models_loaded: Whether both models are loaded
        - mistral_status: Mistral model loading status
        - llama_status: Llama model loading status
        - device: Device being used (cuda/cpu)
        - timestamp: Current server time
        - uptime_seconds: How long the server has been running
    """
    return monitoring_service.get_health_status()

@router.get("/metrics", response_model=models.MetricsResponse | models.MetricsEmptyResponse)
async def get_metrics():
    """
    FR_5.5: Monitor response time performance
    
    Returns detailed metrics about response times including:
    - Total number of requests processed
    - Average response time
    - Percentile metrics (P50, P90, P95, P99)
    - Min/Max response times
    - SLA compliance (90% of requests < 5 seconds)
    """
    return monitoring_service.get_metrics()

@router.post("/metrics/reset", status_code=status.HTTP_200_OK)
async def reset_metrics():
    """
    Reset all metrics data
    
    Useful for:
    - Starting fresh metrics collection
    - Testing purposes
    - After deployment or configuration changes
    """
    return monitoring_service.reset_metrics()

@router.get("/metrics/summary", status_code=status.HTTP_200_OK)
async def get_metrics_summary():
    """
    Get a quick summary of system performance
    
    Returns simplified metrics for dashboard display
    """
    return monitoring_service.get_metrics_summary()