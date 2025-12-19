from collections import defaultdict
from threading import Lock
import time
from datetime import datetime
from typing import List,Optional
import logging
logger = logging.getLogger(__name__)


# ==================== GLOBAL VARIABLES ====================
# Track response times for metrics
response_times: List[float] = []

# Store model loading status
models_status = {
    "mistral_loaded": False,
    "llama_loaded": False,
    "device": "cpu"
}

# Track server start time for uptime calculation
server_start_time = time.time()

# ==================== HELPER FUNCTIONS ====================

def update_models_status(mistral: bool = False, llama: bool = False, device: str = "cpu"):
    """Update the global models status"""
    models_status["mistral_loaded"] = mistral
    models_status["llama_loaded"] = llama
    models_status["device"] = device
    logger.info(f"Models status updated: mistral={mistral}, llama={llama}, device={device}")

def record_response_time(response_time: float):
    """Record a response time for metrics tracking"""
    response_times.append(response_time)
    
    # Limit stored metrics to last 10000 requests to prevent memory issues
    if len(response_times) > 10000:
        response_times.pop(0)
    
    logger.debug(f"Recorded response time: {response_time:.3f}s")

def calculate_percentile(sorted_list: List[float], percentile: float) -> float:
    """Calculate percentile from sorted list"""
    if not sorted_list:
        return 0.0
    index = int(len(sorted_list) * percentile)
    # Ensure index is within bounds
    index = min(index, len(sorted_list) - 1)
    return sorted_list[index]

def get_health_status():
    """Get current health status"""
    uptime = time.time() - server_start_time
    both_loaded = models_status["mistral_loaded"] and models_status["llama_loaded"]
    
    return {
        "status": "healthy" if both_loaded else "degraded",
        "models_loaded": both_loaded,
        "mistral_status": models_status["mistral_loaded"],
        "llama_status": models_status["llama_loaded"],
        "device": models_status["device"],
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": round(uptime, 2)
    }

def get_metrics():
    """Get detailed metrics about response times"""
    if not response_times:
        return {
            "message": "No requests processed yet",
            "count": 0,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    # Calculate metrics
    sorted_times = sorted(response_times)
    count = len(sorted_times)
    
    avg_time = sum(sorted_times) / count
    p50_time = calculate_percentile(sorted_times, 0.50)
    p90_time = calculate_percentile(sorted_times, 0.90)
    p95_time = calculate_percentile(sorted_times, 0.95)
    p99_time = calculate_percentile(sorted_times, 0.99)
    min_time = min(sorted_times)
    max_time = max(sorted_times)
    
    # SLA calculation
    within_5s = sum(1 for t in sorted_times if t < 5.0)
    percentage_within_5s = (within_5s / count * 100) if count > 0 else 0
    sla_met = percentage_within_5s >= 90.0
    
    return {
        "total_requests": count,
        "average_response_time": round(avg_time, 3),
        "p50_response_time": round(p50_time, 3),
        "p90_response_time": round(p90_time, 3),
        "p95_response_time": round(p95_time, 3),
        "p99_response_time": round(p99_time, 3),
        "min_response_time": round(min_time, 3),
        "max_response_time": round(max_time, 3),
        "within_5s_count": within_5s,
        "within_5s_percentage": round(percentage_within_5s, 2),
        "sla_met": sla_met,
        "timestamp": datetime.utcnow().isoformat()
    }

def reset_metrics():
    """Reset all metrics data"""
    global response_times
    old_count = len(response_times)
    response_times = []
    
    logger.info(f"Metrics reset. Previous request count: {old_count}")
    
    return {
        "message": "Metrics reset successfully",
        "previous_request_count": old_count,
        "timestamp": datetime.utcnow().isoformat()
    }

def get_metrics_summary():
    """Get a quick summary of system performance"""
    if not response_times:
        return {
            "status": "no_data",
            "requests": 0,
            "sla_status": "unknown"
        }
    
    sorted_times = sorted(response_times)
    count = len(sorted_times)
    within_5s = sum(1 for t in sorted_times if t < 5.0)
    percentage_within_5s = (within_5s / count * 100) if count > 0 else 0
    
    avg_time = sum(sorted_times) / count
    p90_time = calculate_percentile(sorted_times, 0.90)
    
    # Determine status
    if percentage_within_5s >= 95:
        status = "excellent"
    elif percentage_within_5s >= 90:
        status = "good"
    elif percentage_within_5s >= 80:
        status = "degraded"
    else:
        status = "poor"
    
    return {
        "status": status,
        "requests": count,
        "avg_response_time": round(avg_time, 2),
        "p90_response_time": round(p90_time, 2),
        "sla_compliance": round(percentage_within_5s, 1),
        "sla_status": "met" if percentage_within_5s >= 90 else "not_met",
        "timestamp": datetime.utcnow().isoformat()
    }

def get_total_requests():
    """Get total number of requests processed"""
    return len(response_times)


class IntentMonitor:
    """Monitor and track intent classifications"""
    
    def _init_(self):
        self.lock = Lock()
        self.intent_counts = defaultdict(int)
        self.intent_confidences = defaultdict(list)
        self.intent_response_times = defaultdict(list)
    
    def record_intent_classification(
        self, 
        intent: str, 
        confidence: float,
        response_time: Optional[float] = None
    ):
        """
        Record intent classification event.
        
        Args:
            intent: Detected intent
            confidence: Classification confidence (0-1)
            response_time: Optional response time for this classification
        """
        with self.lock:
            self.intent_counts[intent] += 1
            self.intent_confidences[intent].append(confidence)
            
            if response_time:
                self.intent_response_times[intent].append(response_time)
            
            logger.debug(f"Recorded intent: {intent} (confidence: {confidence:.2f})")

# Create a global instance
intent_monitor = IntentMonitor()