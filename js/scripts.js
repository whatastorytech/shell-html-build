const filtersList = [];
const themesList = [];
const tableData = [];
const deptSelectedFilters = [];
const themeSelectedFilters = [];
let selectedMaturity = "";
let searchKey = "";
let filteredTable = null;

// Create category filters in dom
function createFilterItem(title, id, count, blockSelector = "#dept-filters") {
  const filterItem = document.createElement("div");
  filterItem.setAttribute("class", "dept-filter-item");

  const label = document.createElement("label");
  label.setAttribute("for", id);

  const checkbox = document.createElement("input");
  if (blockSelector == "#dept-filters") {
    checkbox.addEventListener("change", onCheckboxSelect);
  } else {
    checkbox.addEventListener("change", onThemeSelect);
  }
  checkbox.type = "checkbox";
  checkbox.name = checkbox.value = checkbox.id = id;
  checkbox.value = title;
  const labelText = document.createElement("span");
  labelText.textContent = title;

  label.appendChild(checkbox);
  label.appendChild(labelText);

  const countText = document.createElement("span");
  countText.setAttribute("class", "count");
  countText.textContent = count;

  filterItem.appendChild(label);
  filterItem.appendChild(countText);

  document.querySelector(blockSelector).appendChild(filterItem);
}

// Clear Filters
function clearAllCheckbox(container = "#dept-filters") {
  document
    .querySelectorAll(`${container} input`)
    .forEach((checkbox) => (checkbox.checked = false));
  deptSelectedFilters.length = 0;
  filteredTable.clearFilter();
}

//Search filter function
function searchMatchFilter(data, filterParams) {
  if (!filterParams.value) return true;

  let match = false;

  for (var key in data) {
    if (
      ["name", "dept"].includes(key) &&
      data[key]
        .toString()
        .toLowerCase()
        .includes(filterParams.value.toString().toLowerCase())
    ) {
      match = true;
    }
  }
  return match;
}

function onCheckboxSelect() {
  if (this.checked) {
    deptSelectedFilters.push(this.value);
  } else {
    deptSelectedFilters.indexOf(this.value) !== -1 &&
      deptSelectedFilters.splice(deptSelectedFilters.indexOf(this.value), 1);
  }
  filterTable();
}

function onThemeSelect() {
  if (this.checked) {
    themeSelectedFilters.push(this.value);
  } else {
    themeSelectedFilters.indexOf(this.value) !== -1 &&
      themeSelectedFilters.splice(themeSelectedFilters.indexOf(this.value), 1);
  }
  filterTable();
}

function onMaturitySelect() {
  filterTable();
}

function filterTable() {
  const selectedMaturityElement = document.querySelector(
    'input[name="maturity-filters"]:checked'
  );
  selectedMaturity = selectedMaturityElement.value;

  let maturityFilterType = "=";
  if (selectedMaturity == "all") {
    selectedMaturity = "";
    maturityFilterType = "!=";
  } else if (selectedMaturity == "DX") {
    selectedMaturity = ["D3 Demonstrate", "D4 Deploy"];
    maturityFilterType = "in";
  }

  filteredTable.setFilter([
    [
      { field: "name", type: "like", value: searchKey },
      { field: "dept", type: "like", value: searchKey },
      { field: "csditheme", type: "like", value: searchKey },
    ],
    { field: "maturity", type: maturityFilterType, value: selectedMaturity },
    { field: "dept", type: "in", value: deptSelectedFilters },
    { field: "csditheme", type: "in", value: themeSelectedFilters },
  ]);
}

function xmlToJson(xml) {
  // Create the return object
  var obj = {};

  if (xml.nodeType == 1) {
    // element
    // do attributes
    if (xml.attributes.length > 0) {
      obj["@attributes"] = {};
      for (var j = 0; j < xml.attributes.length; j++) {
        var attribute = xml.attributes.item(j);
        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType == 3) {
    // text
    obj = xml.nodeValue;
  }

  // do children
  if (xml.hasChildNodes()) {
    for (var i = 0; i < xml.childNodes.length; i++) {
      var item = xml.childNodes.item(i);
      var nodeName = item.nodeName;
      if (typeof obj[nodeName] == "undefined") {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof obj[nodeName].push == "undefined") {
          var old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
}

function initApiRequest() {
  var xhttp;
  if (window.XMLHttpRequest) {
    // Create an instance of XMLHttpRequest object.
    //code for IE7+, Firefox, Chrome, Opera, Safari
    xhttp = new XMLHttpRequest();
  } else {
    // code for IE6, IE5
    xhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }
  xhttp.open("GET", "sample.xml", false);
  xhttp.send();
  const xmlDoc = xhttp.responseXML;
  const xmlData = xmlToJson(xmlDoc);
  const entries = xmlData.feed.entry;
  tableData.length = 0;
  entries.forEach((entry) => {
    const data = {};
    const props = entry.content["m:properties"];
    data.id = entry.id["#text"];
    data.maturity = props["d:Maturity_Indicator"]["#text"] || "";
    data.name = props["d:Title"]["#text"] || "";
    data.dept = props["d:Project_Category"]["#text"] || "All";
    data.link = `https://eu023-sp.shell.com/sites/SPOAA1264/scar/CSDI_Energy_Transition_Digital_Initiatives/DispForm.aspx?ID=${
      props["d:ID"]["#text"] || "#"
    }`;
    data.csditheme = props["d:Maturity_Indicator"]["#text"] || "";
    tableData.push(data);
  });

  // Get categories from Table Data
  let uniqueCategories = Array.from(new Set(tableData.map((d) => d.dept)));
  uniqueCategories = uniqueCategories
    .map((name) => ({
      name: name,
      value: name,
      count: tableData.filter((d) => d.dept === name).length,
    }))
    .filter((v) => v.name !== "All");
  filtersList.push({
    name: "All",
    value: "all",
    count: tableData.length,
  });
  filtersList.push(...uniqueCategories);

  // Get themes from Table Data
  let uniqueThemes = Array.from(new Set(tableData.map((d) => d.csditheme)));
  uniqueThemes = uniqueThemes
    .map((name) => ({
      name: name,
      value: name,
      count: tableData.filter((d) => d.csditheme === name).length,
    }))
    .filter((v) => v.name !== "All");
  themesList.push(...uniqueThemes);

  // Init Table on data population
  initTable();
}

function initTable() {
  // Create dynamic dept filter lists
  filtersList.forEach((item) => {
    createFilterItem(item.name, item.value, item.count);
  });

  // Create dynamic themes filter lists
  themesList.forEach((item) => {
    createFilterItem(item.name, item.value, item.count, "#themes-filters");
  });

  // Init Tabulator
  const tableElem = document.querySelector("#table-data");
  filteredTable = new Tabulator(tableElem, {
    data: tableData,
    layout: "fitColumns",
    columns: [
      //Table Columns
      {
        title: "CSDI Themes",
        field: "csditheme",
        width: 150,
      },
      {
        title: "Line of Business",
        field: "dept",
        width: 200,
      },
      {
        title: "Project Name",
        field: "name",
        formatter: function (cell) {
          const rowData = cell.getData();
          return `<a href="${rowData.link}">${rowData.name}</a>`;
        },
      },
      {
        title: "Project Maturity",
        field: "maturity",
        headerHozAlign: "center",
        hozAlign: "center",
        width: 150,
        cssClass: "maturity-tag",
        formatter: function (cell) {
          const val = cell.getValue();
          let colorClass = "";
          if (val.includes("D0")) {
            colorClass = "gray";
          } else if (val.includes("D1")) {
            colorClass = "orange";
          } else if (val.includes("D2")) {
            colorClass = "blue";
          } else {
            colorClass = "green";
          }
          return `<span class="${colorClass}"></span>`;
        },
      },
    ],
    pagination: true,
    paginationSize: 10,
  });

  // Attach events to filters
  attachEvents();
}

function attachEvents() {
  // Clear all line of business selected checkbox filters
  document.querySelector("#lb-clear").addEventListener("click", () => {
    clearAllCheckbox();
  });

  // Clear all themes selected checkbox filters
  document.querySelector("#csdi-clear").addEventListener("click", () => {
    clearAllCheckbox("#themes-filters");
  });

  // Get selected value of maturity on change
  document.querySelectorAll(".maturity-filters input").forEach((radio) => {
    radio.addEventListener("change", () => {
      onMaturitySelect();
    });
  });

  // on search typing
  document.querySelector(".search input").addEventListener("keyup", (event) => {
    searchKey = event.target.value;
    console.log("search entered :", event.target.value);
    filterTable();
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initApiRequest();
});
