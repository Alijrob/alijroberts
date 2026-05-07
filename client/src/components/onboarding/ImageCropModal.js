import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from 'react';
const MIN = 40;
export default function ImageCropModal({ src, onConfirm, onCancel }) {
    const containerRef = useRef(null);
    const imgRef = useRef(null);
    const [imgRect, setImgRect] = useState(null);
    const [box, setBox] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    const drag = useRef(null);
    // Measure image after load
    const onLoad = useCallback(() => {
        if (imgRef.current)
            setImgRect(imgRef.current.getBoundingClientRect());
    }, []);
    useEffect(() => {
        const update = () => { if (imgRef.current)
            setImgRect(imgRef.current.getBoundingClientRect()); };
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const onMouseDown = (e, handle) => {
        e.preventDefault();
        e.stopPropagation();
        drag.current = { handle, startX: e.clientX, startY: e.clientY, startBox: { ...box } };
    };
    useEffect(() => {
        const onMove = (e) => {
            if (!drag.current || !imgRect)
                return;
            const { handle, startX, startY, startBox: b } = drag.current;
            const dx = (e.clientX - startX) / imgRect.width;
            const dy = (e.clientY - startY) / imgRect.height;
            const minW = MIN / imgRect.width;
            const minH = MIN / imgRect.height;
            let { x, y, w, h } = b;
            if (handle === 'move') {
                x = clamp(b.x + dx, 0, 1 - b.w);
                y = clamp(b.y + dy, 0, 1 - b.h);
            }
            if (handle === 'n' || handle === 'nw' || handle === 'ne') {
                const newY = clamp(b.y + dy, 0, b.y + b.h - minH);
                h = b.h + (b.y - newY);
                y = newY;
            }
            if (handle === 's' || handle === 'sw' || handle === 'se') {
                h = clamp(b.h + dy, minH, 1 - b.y);
            }
            if (handle === 'w' || handle === 'nw' || handle === 'sw') {
                const newX = clamp(b.x + dx, 0, b.x + b.w - minW);
                w = b.w + (b.x - newX);
                x = newX;
            }
            if (handle === 'e' || handle === 'ne' || handle === 'se') {
                w = clamp(b.w + dx, minW, 1 - b.x);
            }
            setBox({ x, y, w, h });
        };
        const onUp = () => { drag.current = null; };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        // Touch support
        const onTouchMove = (e) => {
            if (!drag.current || !imgRect)
                return;
            const t = e.touches[0];
            onMove({ clientX: t.clientX, clientY: t.clientY });
        };
        const onTouchEnd = () => { drag.current = null; };
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [imgRect]);
    const handleConfirm = async () => {
        const img = imgRef.current;
        if (!img)
            return;
        const canvas = document.createElement('canvas');
        const cw = Math.round(img.naturalWidth * box.w);
        const ch = Math.round(img.naturalHeight * box.h);
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, Math.round(img.naturalWidth * box.x), Math.round(img.naturalHeight * box.y), cw, ch, 0, 0, cw, ch);
        canvas.toBlob(blob => {
            if (!blob)
                return;
            onConfirm(blob, URL.createObjectURL(blob));
        }, 'image/jpeg', 0.92);
    };
    const pct = (v) => `${(v * 100).toFixed(2)}%`;
    const handleStyle = (cursor) => ({
        position: 'absolute',
        width: '14px',
        height: '14px',
        background: '#fff',
        border: '2px solid rgba(0,0,0,0.5)',
        borderRadius: '2px',
        cursor,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        touchAction: 'none',
    });
    const sideStyle = (cursor) => ({
        position: 'absolute',
        background: '#fff',
        opacity: 0.85,
        cursor,
        zIndex: 10,
        touchAction: 'none',
    });
    return (_jsx("div", { style: styles.overlay, children: _jsxs("div", { style: styles.modal, children: [_jsx("p", { style: styles.title, children: "Edit image" }), _jsx("p", { style: styles.hint, children: "Drag sides to crop \u00B7 Drag corners to scale \u00B7 Drag inside to move \u00B7 Use slider to resize" }), _jsxs("div", { ref: containerRef, style: { position: 'relative', display: 'inline-block', userSelect: 'none', maxWidth: '100%' }, children: [_jsx("img", { ref: imgRef, src: src, onLoad: onLoad, draggable: false, style: { display: 'block', maxHeight: '52vh', maxWidth: '100%', borderRadius: '4px' }, alt: "" }), imgRect && (_jsxs(_Fragment, { children: [_jsx("div", { style: { position: 'absolute', top: 0, left: 0, right: 0, height: pct(box.y), background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' } }), _jsx("div", { style: { position: 'absolute', bottom: 0, left: 0, right: 0, top: pct(box.y + box.h), background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' } }), _jsx("div", { style: { position: 'absolute', top: pct(box.y), left: 0, width: pct(box.x), height: pct(box.h), background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' } }), _jsx("div", { style: { position: 'absolute', top: pct(box.y), left: pct(box.x + box.w), right: 0, height: pct(box.h), background: 'rgba(0,0,0,0.55)', pointerEvents: 'none' } }), _jsxs("div", { style: { position: 'absolute', top: pct(box.y), left: pct(box.x), width: pct(box.w), height: pct(box.h), border: '1.5px solid rgba(255,255,255,0.9)', boxSizing: 'border-box', cursor: 'move' }, onMouseDown: e => onMouseDown(e, 'move'), onTouchStart: e => { const t = e.touches[0]; onMouseDown({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => e.preventDefault(), stopPropagation: () => e.stopPropagation() }, 'move'); }, children: [[1 / 3, 2 / 3].map(p => (_jsx("div", { style: { position: 'absolute', top: 0, bottom: 0, left: `${p * 100}%`, width: '1px', background: 'rgba(255,255,255,0.2)', pointerEvents: 'none' } }, `v${p}`))), [1 / 3, 2 / 3].map(p => (_jsx("div", { style: { position: 'absolute', left: 0, right: 0, top: `${p * 100}%`, height: '1px', background: 'rgba(255,255,255,0.2)', pointerEvents: 'none' } }, `h${p}`)))] }), _jsx("div", { style: { ...sideStyle('n-resize'), top: pct(box.y), left: pct(box.x + box.w / 2 - 0.06), width: pct(0.12), height: '4px', marginTop: '-2px' }, onMouseDown: e => onMouseDown(e, 'n') }), _jsx("div", { style: { ...sideStyle('s-resize'), top: pct(box.y + box.h), left: pct(box.x + box.w / 2 - 0.06), width: pct(0.12), height: '4px', marginTop: '-2px' }, onMouseDown: e => onMouseDown(e, 's') }), _jsx("div", { style: { ...sideStyle('w-resize'), left: pct(box.x), top: pct(box.y + box.h / 2 - 0.06), height: pct(0.12), width: '4px', marginLeft: '-2px' }, onMouseDown: e => onMouseDown(e, 'w') }), _jsx("div", { style: { ...sideStyle('e-resize'), left: pct(box.x + box.w), top: pct(box.y + box.h / 2 - 0.06), height: pct(0.12), width: '4px', marginLeft: '-2px' }, onMouseDown: e => onMouseDown(e, 'e') }), _jsx("div", { style: { ...handleStyle('nw-resize'), top: pct(box.y), left: pct(box.x) }, onMouseDown: e => onMouseDown(e, 'nw') }), _jsx("div", { style: { ...handleStyle('ne-resize'), top: pct(box.y), left: pct(box.x + box.w) }, onMouseDown: e => onMouseDown(e, 'ne') }), _jsx("div", { style: { ...handleStyle('sw-resize'), top: pct(box.y + box.h), left: pct(box.x) }, onMouseDown: e => onMouseDown(e, 'sw') }), _jsx("div", { style: { ...handleStyle('se-resize'), top: pct(box.y + box.h), left: pct(box.x + box.w) }, onMouseDown: e => onMouseDown(e, 'se') })] }))] }), _jsxs("div", { style: { width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem' }, children: [_jsx("button", { style: { background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '1rem', width: '28px', height: '28px', flexShrink: 0, lineHeight: 1 }, onClick: () => {
                                setBox(b => {
                                    const step = 0.05;
                                    const nw = Math.max(MIN / (imgRect?.width || 400), b.w - step);
                                    const nh = Math.max(MIN / (imgRect?.height || 400), b.h - step);
                                    const dw = b.w - nw;
                                    const dh = b.h - nh;
                                    return { x: Math.min(b.x + dw / 2, 1 - nw), y: Math.min(b.y + dh / 2, 1 - nh), w: nw, h: nh };
                                });
                            }, children: "\u2212" }), _jsx("input", { type: "range", min: 5, max: 100, step: 1, value: Math.round(Math.min(box.w, box.h) * 100), onChange: e => {
                                const pct = parseInt(e.target.value) / 100;
                                setBox(b => {
                                    const nw = Math.min(pct, 1);
                                    const nh = Math.min(pct, 1);
                                    const x = Math.max(0, Math.min(b.x + (b.w - nw) / 2, 1 - nw));
                                    const y = Math.max(0, Math.min(b.y + (b.h - nh) / 2, 1 - nh));
                                    return { x, y, w: nw, h: nh };
                                });
                            }, style: { flex: 1, accentColor: '#fff', cursor: 'pointer' } }), _jsx("button", { style: { background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '1rem', width: '28px', height: '28px', flexShrink: 0, lineHeight: 1 }, onClick: () => {
                                setBox(b => {
                                    const step = 0.05;
                                    const nw = Math.min(b.w + step, 1 - b.x);
                                    const nh = Math.min(b.h + step, 1 - b.y);
                                    const x = Math.max(0, b.x - (nw - b.w) / 2);
                                    const y = Math.max(0, b.y - (nh - b.h) / 2);
                                    return { x, y, w: Math.min(nw, 1 - x), h: Math.min(nh, 1 - y) };
                                });
                            }, children: "+" }), _jsxs("span", { style: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', minWidth: '36px', textAlign: 'right' }, children: [Math.round(Math.min(box.w, box.h) * 100), "%"] })] }), _jsxs("div", { style: styles.actions, children: [_jsx("button", { style: styles.cancelBtn, onClick: onCancel, children: "Cancel" }), _jsx("button", { style: styles.confirmBtn, onClick: handleConfirm, children: "Use this crop" })] })] }) }));
}
const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '1rem',
    },
    modal: {
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        maxWidth: '600px',
        width: '100%',
    },
    title: { fontSize: '0.95rem', fontWeight: 600, color: '#fff' },
    hint: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '-0.5rem' },
    actions: { display: 'flex', gap: '0.75rem', width: '100%' },
    cancelBtn: {
        flex: 1, padding: '0.7rem', background: 'none',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px',
        color: '#fff', cursor: 'pointer', fontSize: '0.9rem',
    },
    confirmBtn: {
        flex: 2, padding: '0.7rem', background: '#fff',
        border: 'none', borderRadius: '6px',
        color: '#0d0d0d', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
    },
};
