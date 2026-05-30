import React, { useState } from 'react';
import './style.css';

const MCMAnalyzer = () => {
    const [expression, setExpression] = useState("A * B * C * D");
    const [variables, setVariables] = useState([]);
    const [dims, setDims] = useState({});
    const [mTable, setMTable] = useState([]);
    const [sTable, setSTable] = useState([]);
    const [activeCell, setActiveCell] = useState(null);
    const [trace, setTrace] = useState(null); 
    const [optimalPattern, setOptimalPattern] = useState("");
    const [status, setStatus] = useState("SYSTEM ACTIVE");
    const [stepIndex, setStepIndex] = useState(1); 

    const parseExpression = () => {
        const foundVars = [...new Set(expression.match(/[A-Z]/gi))];
        if (!foundVars || foundVars.length < 2) return setStatus("INVALID INPUT");
        setVariables(foundVars);
        const initialDims = {};
        foundVars.forEach(v => initialDims[v] = { r: "", c: "" });
        setDims(initialDims);
        setStepIndex(2);
    };

    const handleDimChange = (v, type, val) => {
        setDims(prev => ({ ...prev, [v]: { ...prev[v], [type]: parseInt(val) || "" } }));
    };

    const runSolve = async () => {
        const pArray = [];
        for (let i = 0; i < variables.length; i++) {
            const cur = dims[variables[i]];
            if (!cur.r || !cur.c) return alert("All fields required");
            if (i > 0 && dims[variables[i-1]].c !== cur.r) return setStatus("COLUMNS AND ROWS SHOULD BE EQUAL");
            if (i === 0) pArray.push(cur.r);
            pArray.push(cur.c);
        }
        setStepIndex(3);
        try {
            const res = await fetch('http://localhost:5000/api/mcm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dims: pArray, labels: variables })
            });
            const data = await res.json();
            animate(0, data.steps, data.pattern);
        } catch (e) { setStatus("CONNECTION ERROR"); }
    };

    const animate = (idx, steps, pattern) => {
        if (idx >= steps.length) {
            setOptimalPattern(pattern);
            setStatus("RESOLVED");
            setActiveCell(null);
            setTrace({ msg: "Execution finished.", isFinished: true });
            return;
        }
        const s = steps[idx];
        setMTable(s.m);
        setSTable(s.s);
        setActiveCell({ i: s.i, j: s.j, k: s.k });
        setTrace({
            val1: s.calc_data.val1,   
            val2: s.calc_data.val2,   
            prod: s.calc_data.prod,   
            total: s.calc_data.total, 
            msg: s.msg,
            formula: s.calc_data.formula,
            isFinished: false
        });
        setTimeout(() => animate(idx + 1, steps, pattern), 700); 
    };

    return (
        <div className="processor-container">
            <nav className="top-branding">
                <div className="brand">MATRIX SOLVER </div>
                <div className={`status-pill ${status}`}>{status}</div>
                <button className="clear-btn" onClick={() => window.location.reload()}>REBOOT SYSTEM</button>
            </nav>

            <section className="viewport">
                {stepIndex === 1 && (
                    <div className="entry-point">
                        <div className="glass-panel">
                            <span className="phase">PHASE_01</span>
                            <h2>Input Matrix Sequence</h2>
                            <input className="input-field-main" value={expression} onChange={(e)=>setExpression(e.target.value)} />
                            <button className="primary-action" onClick={parseExpression}>Initialize Sequence</button>
                        </div>
                    </div>
                )}

                {stepIndex === 2 && (
                    <div className="entry-point scroll-y">
                        <div className="glass-panel wide">
                            <span className="phase">PHASE_02</span>
                            <h2>Configure Vector Dimensions</h2>
                            <div className="dim-grid">
                                {variables.map(v => (
                                    <div key={v} className="dim-card">
                                        <label>Matrix {v}</label>
                                        <div className="dual-inputs">
                                            <input type="number" placeholder="R" onChange={(e)=>handleDimChange(v,'r',e.target.value)} />
                                            <span className="divider">|</span>
                                            <input type="number" placeholder="C" onChange={(e)=>handleDimChange(v,'c',e.target.value)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="primary-action" onClick={runSolve}>Execute Computation</button>
                        </div>
                    </div>
                )}

                {stepIndex === 3 && (
                    <div className="operational-view">
                        <aside className="logic-console">
                            <div className="console-block">
                                <label className="header-label">ALGORITHM_LOGIC</label>
                                <div className="logic-box">
                                    <div className="formula-display">
                                        m[i,j] = min<sub>i≤k&lt;j</sub> &#123; m[i,k] + m[k+1,j] + q<sub>i-1</sub>q<sub>k</sub>q<sub>j</sub> &#125;
                                    </div>
                                    <div className="live-stream">
                                        <p>Processing Stream:</p>
                                        <div className="numeric-flow">
                                            {status !== "RESOLVED" && trace && trace.val1 !== undefined ? (
                                                <>
                                                    <span className="val-a">{trace.val1}</span>
                                                    <span className="sym">+</span>
                                                    <span className="val-b">{trace.val2}</span>
                                                    <span className="sym">+</span>
                                                    <span className="val-c">{trace.prod}</span>
                                                    <span className="sym">=</span>
                                                    <span className="val-res">{trace.total}</span>
                                                </>
                                            ) : (
                                                <span className="completion-tag">{status === "RESOLVED" ? "COMPUTATION_SUCCESS" : "Awaiting Data..."}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="narrative-output">{trace?.msg || "Calculating..."}</div>
                                </div>

                                <div className="result-panel">
                                    <label className="header-label">OPTIMAL_PARENTHESIZATION</label>
                                    <div className="final-string">{optimalPattern || "Analyzing Layout..."}</div>
                                </div>
                            </div>
                        </aside>

                        <section className="data-grids">
                            <div className="grid-section">
                                <label className="header-label">COST_MATRIX (M)</label>
                                <MatrixDisplay n={variables.length} table={mTable} active={activeCell} mode="cost" />
                            </div>
                            <div className="grid-section">
                                <label className="header-label">SPLIT_MATRIX (S)</label>
                                <MatrixDisplay n={variables.length} table={sTable} active={activeCell} mode="split" />
                            </div>
                        </section>
                    </div>
                )}
            </section>
        </div>
    );
};

const MatrixDisplay = ({ n, table, active, mode }) => (
    <div className="table-container">
        <table className="mcm-data-table">
            <thead>
                <tr><th>Row\Col</th>{[...Array(n)].map((_, i) => <th key={i}>{i + 1}</th>)}</tr>
            </thead>
            <tbody>
                {[...Array(n)].map((_, r) => {
                    const i = r + 1;
                    return (
                        <tr key={r}>
                            <td className="fixed-col">{i}</td>
                            {[...Array(n)].map((_, c) => {
                                const j = c + 1;
                                const val = (table && table[i]) ? table[i][j] : 0;
                                const isTarget = active?.i === i && active?.j === j;
                                const isRef = mode === 'cost' && active && (
                                    (i === active.i && j === active.k) || 
                                    (i === active.k + 1 && j === active.j)
                                );
                                return (
                                    <td key={c} className={`mcm-node ${i > j ? 'empty' : ''} ${i === j ? 'zero-cost' : ''} ${isTarget ? 'highlight-cell' : ''} ${isRef ? 'source-cell' : ''}`}>
                                        {i <= j ? (val === Infinity ? "∞" : val) : ""}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

export default MCMAnalyzer;