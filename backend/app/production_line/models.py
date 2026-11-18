"""Data models, status constants, and schemas for the Virtual Production Line simulation."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# Product Lifecycle Status Constants
# -----------------------------------------------------------------------------
class ProductStatus:
    QUEUED = "QUEUED"
    ON_CONVEYOR = "ON_CONVEYOR"
    APPROACHING_SENSOR = "APPROACHING_SENSOR"
    DETECTED = "DETECTED"
    WAITING_FOR_INSPECTION = "WAITING_FOR_INSPECTION"
    INSPECTING = "INSPECTING"
    INSPECTED = "INSPECTED"
    DECISION_PENDING = "DECISION_PENDING"
    CONTROLLER_PROCESSING = "CONTROLLER_PROCESSING"
    READY_FOR_SORTING = "READY_FOR_SORTING"
    SORTING = "SORTING"
    PASSED = "PASSED"
    REJECTED = "REJECTED"
    EXITED = "EXITED"
    FAULT = "FAULT"
    ERROR = "ERROR"


# -----------------------------------------------------------------------------
# Production Line FSM State Constants
# -----------------------------------------------------------------------------
class LineState:
    IDLE = "IDLE"
    WAITING_FOR_PRODUCT = "WAITING_FOR_PRODUCT"
    PRODUCT_DETECTED = "PRODUCT_DETECTED"
    POSITIONING = "POSITIONING"
    INSPECTION = "INSPECTION"
    DECISION = "DECISION"
    CONTROLLER_EXECUTION = "CONTROLLER_EXECUTION"
    CONVEYOR_MOVEMENT = "CONVEYOR_MOVEMENT"
    SORTING = "SORTING"
    CYCLE_COMPLETE = "CYCLE_COMPLETE"
    ERROR = "ERROR"
    EMERGENCY_STOP = "EMERGENCY_STOP"


# -----------------------------------------------------------------------------
# Controller Mode Constants
# -----------------------------------------------------------------------------
class ControllerMode:
    DEAM_LOGIC = "DEAM_LOGIC"
    MICROPROCESSOR_8086 = "MICROPROCESSOR_8086"


# -----------------------------------------------------------------------------
# Default Conveyor Station Coordinates (0 to 100)
# -----------------------------------------------------------------------------
class StationPositions:
    PRODUCT_ENTRY = 0.0
    IR_SENSOR_1 = 10.0          # Product Arrival
    INSPECTION_STATION = 30.0   # Optical Inspection Stop
    IR_SENSOR_2 = 30.0          # Inspection Alignment Confirmation
    SORTING_STATION = 70.0      # Sorting Diverter Gate
    IR_SENSOR_3 = 70.0          # Sorting Gate Arrival
    EXIT_SENSOR = 90.0          # Line Exit & Completed Count
    LINE_END = 100.0


# -----------------------------------------------------------------------------
# Event Types
# -----------------------------------------------------------------------------
class EventType:
    PRODUCT_QUEUED = "PRODUCT_QUEUED"
    PRODUCT_ENTERED = "PRODUCT_ENTERED"
    SENSOR_TRIPPED = "SENSOR_TRIPPED"
    CONVEYOR_STARTED = "CONVEYOR_STARTED"
    CONVEYOR_STOPPED = "CONVEYOR_STOPPED"
    CONVEYOR_PAUSED = "CONVEYOR_PAUSED"
    CONVEYOR_RESUMED = "CONVEYOR_RESUMED"
    INSPECTION_STARTED = "INSPECTION_STARTED"
    INSPECTION_COMPLETED = "INSPECTION_COMPLETED"
    DEAM_DECISION_GENERATED = "DEAM_DECISION_GENERATED"
    CPU_8086_EXECUTED = "CPU_8086_EXECUTED"
    PPI_OUTPUT_UPDATED = "PPI_OUTPUT_UPDATED"
    ACTUATOR_FIRED = "ACTUATOR_FIRED"
    PRODUCT_SORTED = "PRODUCT_SORTED"
    PRODUCT_EXITED = "PRODUCT_EXITED"
    EMERGENCY_STOP = "EMERGENCY_STOP"
    EMERGENCY_RESET = "EMERGENCY_RESET"
    FAULT_INJECTED = "FAULT_INJECTED"
    FAULT_CLEARED = "FAULT_CLEARED"
    STATE_TRANSITION = "STATE_TRANSITION"
