# Smart AC Dimmer: Hardware Design & Simulations

This folder contains the hardware documentation, circuit diagrams, simulation files, and the bill of materials (BOM) for a Smart AC Dimmer project. The project explores the transition from a traditional analog AC dimmer to an intelligent, microcontroller-driven dimmer system. 

All hardware-related files are organized within the `hardware/` directory.

## Directory Structure

```text
hardware/
├── circuit_diagrams/
│   ├── analog_ac_dimming/
│   ├── smart_ac_dimming/
│   └── zero_cross_detection/
├── simulations/
│   ├── analog_ac_dimming/
│   ├── smart_ac_dimming/
│   └── zero_cross_detection/
├── PCB/
├── BOM.xlsx
└── Full Schematic.pdf
```

## Project Modules

### 1. Circuit Diagrams (`/circuit_diagrams`)

This folder contains schematic images and waveform graphs detailing the theoretical progression of the project:

* **`analog_ac_dimming/`**: Covers the foundational circuitry of a traditional AC dimmer. It illustrates how the charging/discharging of a capacitor through a potentiometer is used to achieve the breakdown voltage of a DIAC, which in turn triggers the TRIAC.
* **`smart_ac_dimming/`**: Demonstrates the digital upgrade. The analog timing components (potentiometer, capacitor, and DIAC) are removed and replaced by an Opto-TRIAC driver. A pulse generator is used to mimic an MCU, sending delayed HIGH pulses to trigger the TRIAC digitally.
* **`zero_cross_detection/`**: Contains the circuit and waveforms for the Zero-Crossing Detector (ZCD). Because an MCU cannot automatically sync with the AC grid, this isolated circuitry detects the exact moment the AC wave hits 0V. It sends a HIGH signal to the MCU, acting as an interrupt to reset the timer. This ensures the MCU accurately calculates the delay needed before firing the TRIAC.

### 2. Simulations (`/simulations`)

This folder contains the actual simulation files used to validate the circuits before physical prototyping:

* **`analog_ac_dimming/`**: Contains the **Proteus** simulation files for the traditional DIAC/TRIAC dimmer.
* **`smart_ac_dimming/`**: Contains the **Proteus** simulation files demonstrating the MCU-controlled dimmer using pulse-width logic and an isolated Opto-TRIAC driver (MOC3021).
* **`zero_cross_detection/`**: Contains the **LTspice** simulation files for the ZCD circuit, used to analyze the precise analog timing and output pulses required for the MCU interrupt.

### 3. PCB & BOM

* **`PCB/`**: Contains the kiCAD files for the project.
* **`BOM.xlsx`**: Complete bill of materials listing all components required for assembly, with there respective prices.
* **`Full Schematic.pdf`**: Comprehensive schematic diagram combining the smart ac dimming circuit and zero cross detection circuit.

## Acknowledgments & Credits

This project was made possible thanks to the excellent educational resources provided by the community:

* **[Electronics Tutorials: DIAC Tutorial](https://www.electronics-tutorials.ws/power/diac.html)** – For providing a comprehensive foundation on the working principles of TRIACs and DIACs.
* **YouTube Community** – Special thanks to the creators covering various topics i.e

  * triac drivers [.be/kRrBL9sri10?si=ig0juJTxHIhvTWyB)
  * analog ac dimmer [.be/jS9ANqJf-ZY?si=BGliZ3KXmKWGh3t8)
  * simulating an ac dimmer [.be/RvjNL4PzcWk?si=tl9ha6qjE5_5elTJ)
