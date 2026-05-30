const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

function calculateMCM(p, labels) {
    const n = p.length - 1;
    let m = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));
    let s = Array.from({ length: n + 1 }, () => Array(n + 1).fill(0));
    let steps = [];

    steps = [];

    for (let len = 2; len <= n; len++) {
        for (let i = 1; i <= n - len + 1; i++) {
            let j = i + len - 1;
            m[i][j] = Infinity;

            for (let k = i; k <= j - 1; k++) {
                const q = m[i][k] + m[k + 1][j] + (p[i - 1] * p[k] * p[j]);
                let isNewMin = false;

                if (q < m[i][j]) {
                    m[i][j] = q;
                    s[i][j] = k;
                    isNewMin = true;
                }

              
                steps.push({
                    m: JSON.parse(JSON.stringify(m)),
                    s: JSON.parse(JSON.stringify(s)),
                    i, j, k,
                 
                    calc_data: {
                        val1: m[i][k],            
                        val2: m[k + 1][j],       
                        prod: `(${p[i - 1]}×${p[k]}×${p[j]})`, 
                        total: q,            
                        formula: `m[${i},${k}] + m[${k+1},${j}] + p${i-1}p${k}p${j}`
                    },
                    msg: `Testing split at k=${k} (${labels[k-1]}). ${isNewMin ? "✨ Current Best!" : ""}`
                });
            }
        }
    }

    const buildPattern = (s, i, j) => {
        if (i === j) return labels[i - 1];
        return `(${buildPattern(s, i, s[i][j])} × ${buildPattern(s, s[i][j] + 1, j)})`;
    };

    return { steps, pattern: buildPattern(s, 1, n), finalCost: m[1][n] };
}

app.post('/api/mcm', (req, res) => {
    const { dims, labels } = req.body;
    res.json(calculateMCM(dims, labels));
});

app.listen(PORT, () => console.log(` Server running on ${PORT}`));