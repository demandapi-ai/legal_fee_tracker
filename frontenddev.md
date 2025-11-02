This document outlines the structure and dependencies of the frontend of the Legal Fee Tracker application.

## Frontend Directory Structure

```
src/legal_fee_tracker_frontend
├── dist
│   ├── assets
│   │   ├── index-b62903ef.js
│   │   └── index-ca15d46b.css
│   ├── favicon.ico
│   ├── index.html
│   └── logo2.svg
├── index.html
├── node_modules
├── package.json
├── public
│   ├── favicon.ico
│   └── logo2.svg
├── src
│   ├── App.jsx
│   ├── Header.jsx
│   ├── Home.jsx
│   ├── index.scss
│   ├── main.jsx
│   └── vite-env.d.ts
├── tsconfig.json
└── vite.config.js
```

## Frontend Dependencies

### Production Dependencies

* **@dfinity/agent:** ^3.4.1
* **@dfinity/auth-client:** ^3.4.1
* **@dfinity/candid:** ^3.4.1
* **@dfinity/identity:** ^3.4.1
* **@dfinity/principal:** ^3.4.1
* **react:** ^18.2.0
* **react-dom:** ^18.2.0
* **react-router-dom:** ^6.14.2

### Development Dependencies

* **@types/react:** ^18.2.14
* **@types/react-dom:** ^18.2.6
* **@vitejs/plugin-react:** ^4.0.1
* **autoprefixer:** ^10.4.14
* **dotenv:** ^16.3.1
* **postcss:** ^8.4.24
* **sass:** ^1.63.6
* **tailwindcss:** ^3.3.2
* **typescript:** ^5.1.3
* **vite:** ^4.3.9
* **vite-plugin-environment:** ^1.1.3
