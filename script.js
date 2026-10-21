
const tbody = document.querySelector('#processTable tbody');
let n = 0;

function addProcess(pid = `P${n}`, a = n, b = 4) {
    const tr = document.createElement('tr');

    tr.innerHTML = `<td><input class="pid" value="${pid}"></td><td><input class="arrival" type="number" min="0" value="${a}"></td><td><input class="burst" type="number" min="1" value="${b}"></td><td><button onclick="this.closest('tr').remove()">Remove</button></td>`;

    tbody.appendChild(tr);
    n++;
}

function read() {
    const p = [...tbody.querySelectorAll('tr')].map((r, i) => ({
        pid: r.querySelector('.pid').value.trim() || `P${i}`,
        arrival: +r.querySelector('.arrival').value,
        burst: +r.querySelector('.burst').value
    }));

    if (!p.length) throw Error('Add at least one process.');

    const ids = new Set();

    for (const x of p) {
        if (x.arrival < 0 || !Number.isFinite(x.arrival))
            throw Error('Arrival time must be non-negative.');

        if (x.burst <= 0 || !Number.isFinite(x.burst))
            throw Error('Burst time must be greater than zero.');

        if (ids.has(x.pid))
            throw Error('Process IDs must be unique.');

        ids.add(x.pid);
    }

    return p;
}

function simulate(ps, q, oh) {
    ps = ps.map((p, i) => ({
        ...p,
        index: i,
        rem: p.burst,
        first: null,
        done: null
    })).sort((a, b) => a.arrival - b.arrival || a.index - b.index);

    let t = 0,
        i = 0,
        qy = [],
        last = null,
        sw = 0,
        ohs = 0,
        g = [],
        done = 0;

    const add = () => {
        while (i < ps.length && ps[i].arrival <= t)
            qy.push(ps[i++]);
    };

    while (done < ps.length) {
        add();

        if (!qy.length) {
            t = ps[i].arrival;
            add();
        }

        const p = qy.shift();

        if (last && last.pid !== p.pid) {
            g.push({ l: 'CS', d: oh, cs: 1 });
            t += oh;
            ohs += oh;
            sw++;
            add();
        }

        if (p.first === null) p.first = t;

        const run = Math.min(q, p.rem);

        g.push({ l: p.pid, d: run });

        t += run;
        p.rem -= run;

        add();

        if (p.rem > 0)
            qy.push(p);
        else {
            p.done = t;
            done++;
        }

        last = p;
    }

    return { ps, g, t, sw, ohs };
}

function render(x) {
    document.querySelector('#switchCount').textContent = x.sw;

    document.querySelector('#switchOverhead').textContent =
        x.ohs.toFixed(2);

    document.querySelector('#currentProcess').textContent =
        x.ps[x.ps.length - 1].pid;

    const rb = document.querySelector('#resultTable tbody');
    rb.innerHTML = '';

    let aw = 0,
        at = 0,
        ar = 0,
        busy = 0;

    for (const p0 of x.ps) {
        const tat = p0.done - p0.arrival;
        const w = tat - p0.burst;
        const r = p0.first - p0.arrival;

        aw += w;
        at += tat;
        ar += r;
        busy += p0.burst;

        rb.innerHTML += `<tr><td>${p0.pid}</td><td>${p0.arrival}</td><td>${p0.burst}</td><td>${p0.done.toFixed(2)}</td><td>${w.toFixed(2)}</td><td>${tat.toFixed(2)}</td><td>${r.toFixed(2)}</td></tr>`;
    }

    document.querySelector('#queueView').textContent =
        'Completed Process Order: ' + x.ps.map(p => p.pid).join(' → ');

    document.querySelector('#gantt').innerHTML = x.g.map(s =>
        `<div class="gantt-block ${s.cs ? 'cs' : ''}" style="flex:${Math.max(s.d, .2)}">${s.l}</div>`
    ).join('');

    document.querySelector('#totalTime').textContent = x.t.toFixed(2);
    document.querySelector('#busyTime').textContent = busy.toFixed(2);

    document.querySelector('#avgWait').textContent =
        (aw / x.ps.length).toFixed(2);

    document.querySelector('#avgTurn').textContent =
        (at / x.ps.length).toFixed(2);

    document.querySelector('#avgResp').textContent =
        (ar / x.ps.length).toFixed(2);

    document.querySelector('#util').textContent =
        (busy / x.t * 100).toFixed(2) + '%';
}

document.querySelector('#addBtn').onclick = () => addProcess();

document.querySelector('#resetBtn').onclick = () => {
    tbody.innerHTML = '';
    n = 0;

    addProcess('P0', 0, 5);
    addProcess('P1', 1, 4);
    addProcess('P2', 2, 3);
};

document.querySelector('#simulateBtn').onclick = () => {
    try {
        const q = +document.querySelector('#quantum').value;
        const oh = +document.querySelector('#overhead').value;

        if (q <= 0)
            throw Error('Time quantum must be greater than zero.');

        if (oh < 0)
            throw Error('Context-switch overhead cannot be negative.');

        render(simulate(read(), q, oh));
    } catch (e) {
        alert(e.message);
    }
};

addProcess('P0', 0, 5);
addProcess('P1', 1, 4);
addProcess('P2', 2, 3);
