import { jsx as _jsx } from "react/jsx-runtime";
import Hub from '../Hub';
export default function RavenApp({ brand, onBrandRefresh, onLogout }) {
    return _jsx(Hub, { brand: brand, onBrandRefresh: onBrandRefresh, onLogout: onLogout });
}
