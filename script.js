/* -----------------------------------
   BUSINESS MANAGER – SCRIPT.JS
   Apple Style – Dokumenten-Manager
-------------------------------------*/

/* -------------------------------
   TAB SWITCHING
--------------------------------*/
const tabButtons = document.querySelectorAll(".tab-btn");
const editors = document.querySelectorAll(".editor");

tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const targetID = btn.dataset.target;

        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        editors.forEach(ed => ed.classList.add("hidden"));
        document.getElementById(targetID).classList.remove("hidden");
    });
});


/* -----------------------------------
   SAVE TOAST (APPLE)
-------------------------------------*/
function showSaveToast() {
    const toast = document.getElementById("saveToast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}


/* -----------------------------------
   POSITIONEN HINZUFÜGEN
-------------------------------------*/
function addPosition(type) {
    let tableBody;

    if (type === "rechnung") tableBody = document.querySelector("#r_table tbody");
    if (type === "angebot") tableBody = document.querySelector("#a_table tbody");
    if (type === "lieferschein") tableBody = document.querySelector("#l_table tbody");

    const row = document.createElement("tr");

    if (type === "lieferschein") {
        row.innerHTML = `
            <td></td>
            <td contenteditable="true">Neue Position</td>
            <td><input type="number" step="0.01" value="1"></td>
            <td><input value="Stk."></td>
            <td contenteditable="true"></td>
        `;
    } else {
        row.innerHTML = `
            <td></td>
            <td contenteditable="true">Neue Position</td>
            <td><input type="number" step="0.01" value="1"></td>
            <td><input value="Stk."></td>
            <td><input type="number" step="0.01" value="0"></td>
            <td></td>
        `;
    }

    tableBody.appendChild(row);
    refreshPositions(type);
}


/* -----------------------------------
   POSITIONEN DURCHNUMMERIEREN + SUMMEN
-------------------------------------*/
function refreshPositions(type) {
    let tableBody, sumField, mwstField, totalField;

    if (type === "rechnung") {
        tableBody = document.querySelector("#r_table tbody");
        sumField = document.querySelector("#r_sum");
        mwstField = document.querySelector("#r_mwst");
        totalField = document.querySelector("#r_total");
    }

    if (type === "angebot") {
        tableBody = document.querySelector("#a_table tbody");
        sumField = document.querySelector("#a_total");
    }

    const rows = tableBody.querySelectorAll("tr");
    let sum = 0;

    rows.forEach((row, i) => {
        row.children[0].textContent = i + 1;

        if (type !== "lieferschein") {
            const qty = parseFloat(row.children[2].querySelector("input").value) || 0;
            const price = parseFloat(row.children[4].querySelector("input").value) || 0;
            const total = qty * price;
            row.children[5].textContent = total.toFixed(2);
            sum += total;
        }
    });

    if (type === "rechnung") {
        sumField.value = sum.toFixed(2);
        const mwst = sum * 0.19;
        mwstField.value = mwst.toFixed(2);
        totalField.value = (sum + mwst).toFixed(2);
    }

    if (type === "angebot") {
        sumField.value = sum.toFixed(2);
    }
}


/* -----------------------------------
   WANN SUMMEN AKTUALISIEREN?
-------------------------------------*/
document.addEventListener("input", (e) => {
    if (e.target.closest("#r_table")) refreshPositions("rechnung");
    if (e.target.closest("#a_table")) refreshPositions("angebot");
});


/* -----------------------------------
   DOKUMENTE SPEICHERN
-------------------------------------*/
function saveDocument(type) {
    let data = {};

    if (type === "rechnung") {
        data = {
            type: "rechnung",
            nr: document.getElementById("r_nr").value,
            datum: document.getElementById("r_datum").value,
            kunde: document.getElementById("r_kunde").value,
            address: document.getElementById("r_kunde_adresse").value,
            intro: document.getElementById("r_intro").value,
            footer: document.getElementById("r_footer").value,
            items: getItems("rechnung")
        };
    }

    if (type === "angebot") {
        data = {
            type: "angebot",
            nr: document.getElementById("a_nr").value,
            datum: document.getElementById("a_datum").value,
            kunde: document.getElementById("a_kunde").value,
            address: document.getElementById("a_kunde_adresse").value,
            intro: document.getElementById("a_intro").value,
            footer: document.getElementById("a_footer").value,
            items: getItems("angebot")
        };
    }

    if (type === "lieferschein") {
        data = {
            type: "lieferschein",
            nr: document.getElementById("l_nr").value,
            datum: document.getElementById("l_datum").value,
            kunde: document.getElementById("l_kunde").value,
            address: document.getElementById("l_kunde_adresse").value,
            items: getItems("lieferschein")
        };
    }

    let docs = JSON.parse(localStorage.getItem("docs") || "[]");

    // Entferne altes Dokument, falls gleiche Nummer bereits vorhanden
    docs = docs.filter(d => !(d.type === data.type && d.nr === data.nr));

    docs.push(data);
    localStorage.setItem("docs", JSON.stringify(docs));

    loadArchive();
    showSaveToast();
}


/* -----------------------------------
   POSITIONSDATEN LESEN
-------------------------------------*/
function getItems(type) {
    let rows;

    if (type === "rechnung") rows = document.querySelectorAll("#r_table tbody tr");
    if (type === "angebot") rows = document.querySelectorAll("#a_table tbody tr");
    if (type === "lieferschein") rows = document.querySelectorAll("#l_table tbody tr");

    const items = [];

    rows.forEach(row => {
        const cols = row.children;

        if (type === "lieferschein") {
            items.push({
                text: cols[1].textContent,
                qty: cols[2].querySelector("input").value,
                unit: cols[3].querySelector("input").value,
                note: cols[4].textContent
            });
        } else {
            items.push({
                text: cols[1].textContent,
                qty: cols[2].querySelector("input").value,
                unit: cols[3].querySelector("input").value,
                price: cols[4].querySelector("input").value,
                total: cols[5].textContent
            });
        }
    });

    return items;
}


/* -----------------------------------
   ARCHIV LADEN
-------------------------------------*/
function loadArchive() {
    const docs = JSON.parse(localStorage.getItem("docs") || "[]");

    const rTable = document.getElementById("archiv-rechnung");
    const aTable = document.getElementById("archiv-angebot");
    const lTable = document.getElementById("archiv-lieferschein");

    rTable.innerHTML = headerRow();
    aTable.innerHTML = headerRow();
    lTable.innerHTML = headerRow();

    docs.forEach(doc => {
        const row = `
            <tr>
                <td>${doc.nr}</td>
                <td>${doc.datum || ""}</td>
                <td>${doc.kunde || ""}</td>
                <td><button onclick="loadDocument('${doc.type}','${doc.nr}')">Anzeigen</button></td>
                <td><button onclick="deleteDocument('${doc.type}','${doc.nr}')">Löschen</button></td>
            </tr>
        `;

        if (doc.type === "rechnung") rTable.innerHTML += row;
        if (doc.type === "angebot") aTable.innerHTML += row;
        if (doc.type === "lieferschein") lTable.innerHTML += row;
    });
}

function headerRow() {
    return `
      <tr>
        <th onclick="sortArchive(0)">Nummer</th>
        <th>Datum</th>
        <th>Kunde</th>
        <th>Anzeigen</th>
        <th>Löschen</th>
      </tr>`;
}


/* -----------------------------------
   SORTIEREN
-------------------------------------*/
function sortArchive(typeColumn) {
    loadArchive(); // sortierung später erweitern, Basisstruktur gesetzt
}


/* -----------------------------------
   DOKUMENT LADEN
-------------------------------------*/
function loadDocument(type, nr) {
    const docs = JSON.parse(localStorage.getItem("docs") || "[]");
    const doc = docs.find(d => d.type === type && d.nr === nr);

    if (!doc) return;

    // Tab wechseln
    document.querySelector(`[data-target="editor-${type}"]`).click();

    if (type === "rechnung") {
        document.getElementById("r_nr").value = doc.nr;
        document.getElementById("r_datum").value = doc.datum;
        document.getElementById("r_kunde").value = doc.kunde;
        document.getElementById("r_kunde_adresse").value = doc.address;
        document.getElementById("r_intro").value = doc.intro;
        document.getElementById("r_footer").value = doc.footer;

        fillItems("rechnung", doc.items);
    }

    if (type === "angebot") {
        document.getElementById("a_nr").value = doc.nr;
        document.getElementById("a_datum").value = doc.datum;
        document.getElementById("a_kunde").value = doc.kunde;
        document.getElementById("a_kunde_adresse").value = doc.address;
        document.getElementById("a_intro").value = doc.intro;
        document.getElementById("a_footer").value = doc.footer;

        fillItems("angebot", doc.items);
    }

    if (type === "lieferschein") {
        document.getElementById("l_nr").value = doc.nr;
        document.getElementById("l_datum").value = doc.datum;
        document.getElementById("l_kunde").value = doc.kunde;
        document.getElementById("l_kunde_adresse").value = doc.address;

        fillItems("lieferschein", doc.items);
    }
}


/* -----------------------------------
   ITEMS LADEN
-------------------------------------*/
function fillItems(type, items) {
    let tableBody;

    if (type === "rechnung") tableBody = document.querySelector("#r_table tbody");
    if (type === "angebot") tableBody = document.querySelector("#a_table tbody");
    if (type === "lieferschein") tableBody = document.querySelector("#l_table tbody");

    tableBody.innerHTML = "";

    items.forEach(it => {
        const row = document.createElement("tr");

        if (type === "lieferschein") {
            row.innerHTML = `
                <td></td>
                <td contenteditable="true">${it.text}</td>
                <td><input value="${it.qty}"></td>
                <td><input value="${it.unit}"></td>
                <td contenteditable="true">${it.note}</td>
            `;
        } else {
            row.innerHTML = `
                <td></td>
                <td contenteditable="true">${it.text}</td>
                <td><input value="${it.qty}"></td>
                <td><input value="${it.unit}"></td>
                <td><input value="${it.price}"></td>
                <td>${parseFloat(it.total).toFixed(2)}</td>
            `;
        }

        tableBody.appendChild(row);
    });

    refreshPositions(type);
}


/* -----------------------------------
   DOKUMENT LÖSCHEN
-------------------------------------*/
function deleteDocument(type, nr) {
    let docs = JSON.parse(localStorage.getItem("docs") || "[]");
    docs = docs.filter(d => !(d.type === type && d.nr === nr));
    localStorage.setItem("docs", JSON.stringify(docs));
    loadArchive();
}


/* -----------------------------------
   ACCORDION
-------------------------------------*/
function toggleAccordion(id) {
    document.getElementById(id).classList.toggle("open");
}


/* -----------------------------------
   START
-------------------------------------*/
loadArchive();
