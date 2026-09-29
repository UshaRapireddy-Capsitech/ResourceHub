import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { initializeIcons } from "@fluentui/react";
import { store } from "./store/store";
import App from "./App";
import "./index.css";

initializeIcons();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
      <App />
  </Provider>
);
