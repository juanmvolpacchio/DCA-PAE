import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router-dom";

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

import MainScreen from "./routes/root/root";

import WellScreen from "./routes/well/well";

const router = createHashRouter([
  {
    id: "root",
    path: "/",
    element: <MainScreen />,
    children: [
      {
        id: "well",
        path: ":well",
        element: <WellScreen />,
      },
    ],
  },
]);

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
