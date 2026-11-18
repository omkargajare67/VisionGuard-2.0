from typing import Dict

EXAMPLE_PROGRAMS: Dict[str, Dict[str, str]] = {
    "visionguard_controller": {
        "title": "VisionGuard Inspection Controller",
        "description": "Reads OpenCV defect flags from 8255 Port A (80H), evaluates quality status, and asserts PASS/REJECT sorting signals on Port B (81H).",
        "code": """; ===================================================================
; VisionGuard 2.0: Automated Sorting Line 8086 Inspection Controller
; Port A (80H): Input from OpenCV Camera (PA0=D, PA1=S, PA2=C, PA3=L, PA4=M, PA5=G)
; Port B (81H): Output Actuators (PB0=Conveyor, PB1=Gate, PB2=GreenLED, PB3=RedLED, PB4=Buzzer)
; ===================================================================

START:
    ; 1. Read optical feature extraction flags from 8255 PPI Port A
    IN AL, 80H

    ; 2. Test bit 0 (D: Product Detected)
    TEST AL, 01H
    JZ NO_PRODUCT_DETECTED

    ; 3. Check defect signals:
    ; Nominal mask: D=1, S=0, C=1, L=1, M=1, G=1 -> 00111101B = 3DH (61 decimal)
    MOV BL, AL
    AND BL, 3FH            ; Mask out upper unused bits 6-7
    CMP BL, 3DH            ; Compare against nominal standard workpiece
    JNE DEFECT_REJECTED

PRODUCT_PASSED:
    ; WORKPIECE NOMINAL (PASS):
    ; PB0 = 1 (Conveyor RUN), PB2 = 1 (Green LED ON) -> 00000101B = 05H
    MOV AL, 05H
    OUT 81H, AL
    JMP INSPECTION_COMPLETE

DEFECT_REJECTED:
    ; WORKPIECE DEFECTIVE (REJECT):
    ; PB1 = 1 (Actuate Reject Diverter), PB3 = 1 (Red LED ON), PB4 = 1 (Alarm Buzzer) -> 00011010B = 1AH
    MOV AL, 1AH
    OUT 81H, AL
    JMP INSPECTION_COMPLETE

NO_PRODUCT_DETECTED:
    ; NO WORKPIECE IN FIXTURE (UNREADABLE):
    ; All actuators & indicator LEDs held LOW -> 00H
    MOV AL, 00H
    OUT 81H, AL

INSPECTION_COMPLETE:
    HLT                    ; Halt cycle until next optical trigger
""",
    },
    "arithmetic_logic_demo": {
        "title": "ALU Arithmetic & Logic Suite",
        "description": "Demonstrates 16-bit register arithmetic, bitwise masking, 8-bit aliasing (AH/AL vs AX), and FLAGS generation.",
        "code": """; ===================================================================
; Educational 8086 ALU & Register Aliasing Demonstration
; ===================================================================

START:
    MOV AX, 0005H          ; Load immediate 16-bit word
    MOV BX, 0003H
    ADD AX, BX             ; AX = 0008H (Flags: ZF=0, CF=0, SF=0)
    
    ; 8-bit Aliasing Test: modify high byte AH, verify AX changes
    MOV AH, 0F0H           ; AX becomes F008H without clobbering AL
    MOV AL, 02H            ; AX becomes F002H

    ; Subtraction & Carry/Borrow test
    MOV CX, 000AH
    SUB CX, 000AH          ; CX = 0000H (Sets Zero Flag ZF=1)

    ; Bitwise logic
    MOV DX, 0FF00H
    AND DX, 0F0F0H         ; DX = F000H
    OR  DX, 0000FH         ; DX = F00FH
    XOR DX, 0FFFFH         ; DX = 0FF0H (Inverts bits)

    HLT
""",
    },
    "array_sum_loop": {
        "title": "Array Summation with LOOP",
        "description": "Uses CX register and LOOP instruction to iterate and accumulate numbers in memory.",
        "code": """; ===================================================================
; Educational Array Accumulator using CX and LOOP
; ===================================================================

START:
    MOV AX, 0000H          ; Initialize accumulator to 0
    MOV CX, 0005H          ; Loop counter = 5 iterations
    MOV BX, 0001H          ; Initial addend

SUM_LOOP:
    ADD AX, BX             ; Accumulate: AX = AX + BX
    INC BX                 ; Increment addend
    LOOP SUM_LOOP          ; Decrements CX; if CX != 0 jumps to SUM_LOOP

    HLT                    ; Expected result in AX: 1+2+3+4+5 = 15 (000FH)
""",
    },
    "subroutine_call_stack": {
        "title": "Stack Operations & Subroutine CALL/RET",
        "description": "Demonstrates PUSH, POP, CALL subroutine, stack pointer (SP) tracking, and return with RET.",
        "code": """; ===================================================================
; Subroutine CALL & Stack Preservation Demonstration
; ===================================================================

START:
    MOV AX, 1234H
    PUSH AX                ; Push AX to stack (SP decrements by 2)
    
    MOV AX, 5678H
    CALL DOUBLE_VALUE      ; Calls subroutine; pushes return IP to stack
    
    POP BX                 ; Restores original 1234H into BX
    HLT

DOUBLE_VALUE:
    ADD AX, AX             ; AX = 5678H * 2 = ACFOh
    RET                    ; Pops return IP from stack and resumes
""",
    },
    "hardware_interrupt_isr": {
        "title": "Proximity Sensor Interrupt Service Routine",
        "description": "Simulates product arrival interrupt triggering the registered ISR to strobe camera.",
        "code": """; ===================================================================
; VisionGuard Product Arrival Sensor Interrupt Service Routine (ISR)
; Demonstrates interrupt entry, stack preservation, and IRET restoration
; ===================================================================

START:
    STI                    ; Enable maskable interrupts (IF = 1)
    MOV AX, 0000H

MAIN_IDLE_LOOP:
    INC AX                 ; Background conveyor progress counter
    CMP AX, 0064H
    JNE MAIN_IDLE_LOOP
    HLT

; Simulated ISR registered in IVT vector 09H (Proximity Sensor Trip)
SENSOR_TRIP_ISR:
    PUSH AX                ; Preserve working registers on stack
    MOV AL, 01H            ; Strobe camera acquisition signal
    OUT 82H, AL            ; Write to Port C handshake line
    POP AX                 ; Restore registers
    IRET                   ; Return from interrupt (Pops IP, CS, FLAGS)
""",
    },
}
