import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const base = {
    width: 15, height: 15, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
};
export const SIDEBAR_ICON_KEYS = [
    'link', 'globe', 'server', 'terminal', 'database',
    'cloud', 'box', 'layers', 'shield', 'zap',
    'monitor', 'folder', 'feather',
];
export const SIDEBAR_ICON_LABELS = {
    link: 'Link', globe: 'Globe', server: 'Server', terminal: 'Terminal', database: 'Database',
    cloud: 'Cloud', box: 'Box', layers: 'Layers', shield: 'Shield', zap: 'Lightning',
    monitor: 'Monitor', folder: 'Folder', feather: 'Feather',
};
export function renderSidebarIcon(key) {
    switch (key) {
        case 'globe':
            return _jsxs("svg", { ...base, children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("line", { x1: "2", y1: "12", x2: "22", y2: "12" }), _jsx("path", { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" })] });
        case 'server':
            return _jsxs("svg", { ...base, children: [_jsx("rect", { x: "2", y: "3", width: "20", height: "6", rx: "1" }), _jsx("rect", { x: "2", y: "15", width: "20", height: "6", rx: "1" }), _jsx("line", { x1: "6", y1: "6", x2: "6.01", y2: "6" }), _jsx("line", { x1: "6", y1: "18", x2: "6.01", y2: "18" })] });
        case 'terminal':
            return _jsxs("svg", { ...base, children: [_jsx("polyline", { points: "4 17 10 11 4 5" }), _jsx("line", { x1: "12", y1: "19", x2: "20", y2: "19" })] });
        case 'database':
            return _jsxs("svg", { ...base, children: [_jsx("ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }), _jsx("path", { d: "M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" }), _jsx("path", { d: "M3 12c0 1.7 4 3 9 3s9-1.3 9-3" })] });
        case 'cloud':
            return _jsx("svg", { ...base, children: _jsx("path", { d: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" }) });
        case 'box':
            return _jsxs("svg", { ...base, children: [_jsx("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }), _jsx("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }), _jsx("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" })] });
        case 'layers':
            return _jsxs("svg", { ...base, children: [_jsx("polygon", { points: "12 2 2 7 12 12 22 7 12 2" }), _jsx("polyline", { points: "2 17 12 22 22 17" }), _jsx("polyline", { points: "2 12 12 17 22 12" })] });
        case 'shield':
            return _jsx("svg", { ...base, children: _jsx("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }) });
        case 'zap':
            return _jsx("svg", { ...base, children: _jsx("polygon", { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2" }) });
        case 'monitor':
            return _jsxs("svg", { ...base, children: [_jsx("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2" }), _jsx("line", { x1: "8", y1: "21", x2: "16", y2: "21" }), _jsx("line", { x1: "12", y1: "17", x2: "12", y2: "21" })] });
        case 'folder':
            return _jsx("svg", { ...base, children: _jsx("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" }) });
        case 'feather':
            return _jsxs("svg", { ...base, children: [_jsx("path", { d: "M3 18c4-1 7-4 8-9" }), _jsx("path", { d: "M11 9l3-3 6 1-1 4-5 2" }), _jsx("circle", { cx: "17", cy: "6", r: "0.8", fill: "currentColor" }), _jsx("path", { d: "M3 18l3 3" })] });
        case 'link':
        default:
            return _jsxs("svg", { ...base, children: [_jsx("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), _jsx("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })] });
    }
}
