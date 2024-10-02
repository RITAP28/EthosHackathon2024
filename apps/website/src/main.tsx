import { Provider } from "react-redux";
import { persistor, store } from "./redux/store";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { PersistGate } from "redux-persist/integration/react";
import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter } from "react-router-dom";
import WebSocketProvider from "./context/WebSocketContext.tsx";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <WebSocketProvider>
        <ChakraProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ChakraProvider>
      </WebSocketProvider>
    </PersistGate>
  </Provider>
);
