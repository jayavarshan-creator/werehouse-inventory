import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  HelpCircle, 
  Database, 
  Terminal, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Cpu,
  Layers
} from 'lucide-react';

export default function VivaPrepGuide() {
  const [openQuestion, setOpenQuestion] = useState(0);

  const units = [
    {
      unit: 'Unit 1',
      title: 'Introduction to Intelligent Systems & Full-Stack Architecture',
      duration: '18 hours',
      topics: 'Definition & Scope of Intelligent Systems, Overview of MERN Stack, Frontend-Backend-Database Integration, REST APIs and JSON, Dashboard & Adaptive Interfaces.',
      projectApplication: 'This project implements a complete 3-tier MERN architecture: React JSX UI communicating via JSON REST endpoints to an Express backend connected to MongoDB schemas, integrated with an intelligent ESP32 IoT edge gateway.'
    },
    {
      unit: 'Unit 2',
      title: 'Building Intelligent Frontend with React',
      duration: '18 hours',
      topics: 'React Basics: JSX, Components, Props, State, Lifecycle & Hooks, Event Handling, Smart UI Behaviors (Conditional Rendering, Dynamic Components), API Integration, Controlled Forms using event.preventDefault().',
      projectApplication: 'Written entirely in React JSX using useState, useEffect, and custom Context API. Forms are strictly controlled using event.preventDefault() with validation and dynamic feedback badges (loading, empty, success, error).'
    },
    {
      unit: 'Unit 3',
      title: 'Backend Development with Node.js and Express',
      duration: '18 hours',
      topics: 'Node.js Runtime, Setting Up Express Server, Routes, Controllers, and Middleware, Request/Response Lifecycle, User Authentication using JWT, Security Best Practices & Error Handling.',
      projectApplication: 'Express server with modular REST endpoints (/api/items, /api/warehouses, /api/stock-movements, /api/transfers, /api/purchase-receipts). Includes authMiddleware verifying JWT Bearer tokens and role authorization.'
    },
    {
      unit: 'Unit 4',
      title: 'NoSQL Database Design with MongoDB',
      duration: '18 hours',
      topics: 'NoSQL & Document Databases, MongoDB CRUD Operations, Schema Design & Validation with Mongoose, Relational Thinking in NoSQL, Queries & Aggregation Pipelines.',
      projectApplication: 'Designed 7 Mongoose schemas: User (with bcrypt hashing), Warehouse, Item (with reorderLevel & RFID index), Supplier, StockMovement, Transfer, and PurchaseReceipt.'
    },
    {
      unit: 'Unit 5',
      title: 'Full-Stack Integration and Smart System Deployment',
      duration: '18 hours',
      topics: 'Connecting Frontend, Backend, Database; Smart Search, Filters & Personalization; Environment Variables; Deployment on Render/Netlify/Vercel; Capstone Complete Intelligent System.',
      projectApplication: 'Live search, warehouse/category multi-filters, low-stock threshold alert triggers, and an automated ESP32 RFID inventory intake gate.'
    }
  ];

  const vivaQuestions = [
    {
      q: 'Q1: What is the MERN stack and why did you select it for this Warehouse System?',
      a: 'MERN stands for MongoDB (NoSQL Database), Express.js (Backend Web Framework), React.js (Frontend User Interface), and Node.js (JavaScript Runtime Environment). I chose MERN because it allows using a single language—JavaScript—across the entire stack with JSON data flow between the React JSX frontend and Express REST APIs.'
    },
    {
      q: 'Q2: Why do you call event.preventDefault() in your React form handlers?',
      a: 'In standard HTML, submitting a form reloads the whole browser window and issues an HTTP GET/POST request. In a React Single Page Application (SPA), calling event.preventDefault() stops the page from reloading, allowing us to validate the inputs and use the asynchronous fetch() API to submit data seamlessly in the background.'
    },
    {
      q: 'Q3: What is the difference between props and state in React?',
      a: 'State is internal, mutable data managed inside the component using the useState() hook (e.g. currentStock, formData, loading). Props (properties) are read-only inputs passed from a parent component to a child component (e.g. passing onNavigate or activeTab to Navbar).'
    },
    {
      q: 'Q4: How does JWT Authentication work in this project?',
      a: 'When a user logs in with their email and password, the Express server verifies the password using bcrypt.compareSync(). If valid, the server creates a JSON Web Token signed with a JWT_SECRET. The React frontend stores this token in localStorage and sends it in the HTTP header as "Authorization: Bearer <token>" for protected CRUD routes.'
    },
    {
      q: 'Q5: Why do we write Mongoose Schemas if MongoDB is schema-less?',
      a: 'While MongoDB allows flexible documents, business applications need strict data integrity. Mongoose schemas enforce required fields (e.g., item SKU, name, unitPrice), data types, enum values for roles, default values, and indexes (like indexing rfidTag for fast ESP32 lookups).'
    },
    {
      q: 'Q6: How are User Roles (Admin, Warehouse Manager, Storekeeper) enforced?',
      a: 'We use Role-Based Access Control (RBAC). In the backend, our authorizeRole(["Admin", "Warehouse Manager"]) middleware inspects req.user.role from the decoded JWT. If a Storekeeper tries to delete a warehouse or item, the server returns an HTTP 403 Forbidden error.'
    },
    {
      q: 'Q7: How does the system calculate and trigger Reorder Level alerts?',
      a: 'Each Item model has currentStock and reorderLevel properties. When stock drops such that (currentStock <= reorderLevel), the virtual property isLowStock evaluates to true. The system highlights the item in amber/red badges and displays a high-priority Restock Alert on the dashboard.'
    },
    {
      q: 'Q8: How does the ESP32 microcontroller interact with the Node.js backend?',
      a: 'The ESP32 connects to the local WiFi network using WiFi.h. When an RFID tag is detected on the RC522 antenna via SPI bus, the ESP32 creates a JSON payload {"rfidTag": UID, "action": "IN", "quantity": 1} and sends an HTTP POST request to the /api/esp32/scan endpoint using HTTPClient.h. Node.js processes the scan and returns HTTP 200 OK.'
    },
    {
      q: 'Q9: What happens if an unregistered RFID card is tapped on the ESP32 gate?',
      a: 'The Express backend searches the database for that RFID tag. If not found, it logs an unknown scan warning in the audit table, responds with HTTP 404 and { buzzerPattern: "ERROR_DOUBLE_BEEP" }, and the ESP32 sounds two short error beeps on the buzzer to alert the warehouse operator.'
    },
    {
      q: 'Q10: Explain the difference between StockMovement, Transfer, and PurchaseReceipt.',
      a: 'StockMovement tracks every physical stock increase or decrease (IN, OUT, or ADJUSTMENT). PurchaseReceipt records supplier deliveries and automatically logs Stock IN movements. Transfer moves inventory from one physical warehouse to another and requires manager approval before stock levels shift.'
    },
    {
      q: 'Q11: How is error handling implemented in the frontend and backend?',
      a: 'On the frontend, all API calls are wrapped in try { ... } catch (err) { setError(err.message) } blocks. If a network fails or the server returns !response.ok, an error message banner is shown to the user. On the backend, we validate required fields and return standardized JSON { success: false, message: "..." } with HTTP status codes 400, 401, 403, 404, or 500.'
    },
    {
      q: 'Q12: How would you deploy this project for final semester submission?',
      a: 'Frontend can be built with "npm run build" and hosted on Vercel or Netlify. The Node.js Express backend can be deployed on Render or Railway with environment variables (MONGO_URI, JWT_SECRET, PORT). The MongoDB database is hosted on MongoDB Atlas free cluster.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-400" />
            <h1 className="text-base font-bold uppercase tracking-wide">
              Internal Exam Presentation & Viva Guide
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
              Units 1 to 5 Syllabus
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reference answers for teacher viva questions, syllabus mapping, and technical concepts to secure top internal marks.
          </p>
        </div>
      </div>

      {/* Syllabus Units Mapping (From Syllabus Photo) */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-200">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Syllabus Units Reference (As Taught in Class)
        </h2>

        <div className="space-y-3">
          {units.map((u, idx) => (
            <div key={idx} className="border border-slate-200 rounded p-3 bg-slate-50 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-800 font-mono text-[11px] bg-blue-100 px-2 py-0.5 rounded">
                  {u.unit}: {u.title}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">{u.duration}</span>
              </div>
              <p className="text-slate-600 text-[11px] pt-1">
                <strong>Classroom Topics:</strong> {u.topics}
              </p>
              <div className="mt-1 text-[11px] text-slate-800 bg-white p-2 rounded border border-slate-200">
                <strong className="text-blue-700">How our project satisfies this unit:</strong> {u.projectApplication}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 12 Viva Questions & Answers */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            12 Essential Teacher Viva Questions & Answers
          </h2>
          <span className="text-[11px] text-slate-500">Click any question to view student answer</span>
        </div>

        <div className="space-y-2">
          {vivaQuestions.map((item, idx) => {
            const isOpen = openQuestion === idx;
            return (
              <div key={idx} className="border border-slate-200 rounded overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenQuestion(isOpen ? -1 : idx)}
                  className={`w-full text-left p-3 text-xs font-bold flex items-center justify-between transition-colors ${
                    isOpen ? 'bg-slate-900 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-blue-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="p-3 bg-white text-xs text-slate-700 leading-relaxed border-t border-slate-200 space-y-2">
                    <p className="font-medium text-slate-900">{item.a}</p>
                    <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Answer ready for examiner evaluation
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Local Setup Instructions (How to recreate on your own PC) */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-white shadow-sm space-y-3 text-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2 pb-2 border-b border-slate-800">
          <Terminal className="w-4 h-4" />
          How to Recreate & Run on Your Local Machine
        </h2>

        <div className="space-y-2 text-[11px] text-slate-300">
          <p><strong>Step 1: Clone or extract files</strong> into a project folder (e.g. <code className="bg-slate-800 px-1 rounded text-blue-300">warehouse-system</code>).</p>
          <p><strong>Step 2: Install dependencies</strong> using terminal:</p>
          <div className="bg-black p-2 rounded font-mono text-emerald-400 text-[10px]">
            npm install
          </div>
          <p><strong>Step 3: Start Node.js Express & Vite full-stack server</strong>:</p>
          <div className="bg-black p-2 rounded font-mono text-emerald-400 text-[10px]">
            npm run dev
          </div>
          <p>Open your browser at <span className="text-blue-400 font-mono">http://localhost:3000</span> to test the React frontend and Express REST APIs.</p>
          <p><strong>Step 4: (Optional Hardware) Flash ESP32 NodeMCU</strong>:</p>
          <p>Open <code className="bg-slate-800 px-1 rounded text-blue-300">backend/esp32/warehouse_esp32_scanner.ino</code> in Arduino IDE, update your WiFi SSID/Password, and upload to your ESP32 board!</p>
        </div>
      </div>

    </div>
  );
}
