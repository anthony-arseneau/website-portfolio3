# Portfolio Redesign Brief: Anthony Arseneau
## Identity: Mechanical Engineering Graduate Student

### 1. The Grand Goal
Transform the existing general-software portfolio into a highly specialized, sophisticated, and minimalist "deep-tech" portfolio targeted at aerospace and mechanical engineering recruiters. The vibe should be industrial, precise, and heavily inspired by the SpaceX landing page. It must scream "Hardware/Software Integration and Fluid Mechanics" rather than "Front-End Web Developer."

### 2. Aesthetic & UI Philosophy
* **Theme:** Strict Dark Mode. Deep space black (`#000000`) backgrounds with pure white text for maximum contrast.
* **Depth through Layering:** No flat UI. Use subtle, increasingly lighter grays to indicate depth. Background is absolute black; section containers are very dark gray; interactive cards are slightly lighter. Hover states should elevate elements with subtle scaling and increased drop shadows, not bright color shifts.
* **Typography:** Clean, sans-serif, technical fonts. Heavy use of ALL-CAPS with wide tracking (letter-spacing) for headers and labels to mimic aerospace UI.
* **Navbar:** Solid black, "smart" vanishing navbar. Hides on scroll down to maximize screen space; reveals instantly on scroll up. NO "liquid glass" or blur effects.

### 3. Core Sections & Requirements

#### A. Hero Section (Landing)
* **Background:** Performant 3D canvas (Three.js/react-three-fiber). Do NOT use generic tech nodes. Implement a rotating, highly detailed mechanical model (e.g., a Planetary Gear System or a Geared Turbofan Engine). 
* **Typography:** Large, bold title: "ANTHONY ARSENEAU | MECHANICAL ENGINEER".
* **Dynamic Stats:** Directly below the title, include a SpaceX-style animated count-up row for key metrics:
    * `4.3 / 4.3` (Highlighting MEng GPA)
    * `5+` (Engineering/CAD Projects)
    * `2` (Technical Internships)

#### B. Technologies Stack
* **Layout:** Discard the rigid box format. Use a clean, monochrome grid of icons that illuminate into brand colors ONLY upon hover.
* **Categorization & Priority:** 1.  *CAD & Systems (Prioritized):* Fusion 360, AutoCAD, CATIA, ANSYS, MATLAB & Simulink, C++, Arduino, 3D Printing. **Visually highlight CAD software.**
    2.  *Software & Backend:* SQL (must be added), Java, Spring Boot, React, Bash, Ubuntu Server, etc.

#### C. Experience & Education
* **Layout:** Remove rigid vertical timeline lines. Translate job entries into sophisticated, independent, elevated cards.
* **Job Entries to Keep:** Planning at Belledune Generating Station Intern (NB Power), Meter Services Intern (NB Power), Web Developer.
* **Education to Keep:** MEng Mechanical Engineering (UNB), BSc Computer Science (Mount Allison). 
* **Logos:** Create a monochrome strip of relevant institutional logos (UNB, Mount Allison, NB Power). Strip out non-engineering entities. Logos turn to full color on hover.

#### D. Projects
* **Layout:** Alternating row layout (Image Left/Text Right, then Image Right/Text Left) to create visual flow. 
* **Entries:** Keep "Self-Leveling Robot", "Portfolio Website", "Sight Reading Application", and "Encrypted Messaging Application." Focus descriptions heavily on the mathematical, hardware, and systems-level logic used to build them.

### 4. Technical Constraints
* **Stack:** React, Vite, Tailwind CSS.
* **Animations:** Use Framer Motion for count-up numbers, card reveals on scroll, and the vanishing navbar. Use Three.js for the Hero background.
* **Performance:** The 3D model must be lightweight and use `requestAnimationFrame` properly. The site must maintain 60fps scrolling. Mobile responsiveness is mandatory.