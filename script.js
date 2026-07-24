let statusChart;
let cityChart;

let originalData = [];
let currentData = [];

const fileInput = document.getElementById("csvFile");

fileInput.addEventListener("change", function (event) {

    const file = event.target.files[0];

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,

        complete: function (results) {

            const data = results.data;

            originalData = data;
            currentData = data;

            populateCities(data);

            calculateDashboard(data);
            createCharts(data);
            createDriverTable(data);
            createCityRevenueTable(data);

        }
    });

});

function calculateDashboard(data) {

    document.getElementById("totalRides").innerText = data.length;

    let revenue = 0;
    let rating = 0;

    data.forEach(row => {

        revenue += Number(row.fare_amount);
        rating += Number(row.rating);

    });

    document.getElementById("totalRevenue").innerText = "₹" + revenue;

    document.getElementById("avgRating").innerText =
        (rating / data.length).toFixed(2);

}

function createCharts(data) {

    let statusCount = {};
    let cityRevenue = {};

    data.forEach(row => {

        statusCount[row.status] = (statusCount[row.status] || 0) + 1;

        cityRevenue[row.city] =
            (cityRevenue[row.city] || 0) + Number(row.fare_amount);

    });

    if (statusChart)
        statusChart.destroy();

    if (cityChart)
        cityChart.destroy();

    statusChart = new Chart(document.getElementById("statusChart"), {

        type: "pie",

        data: {

            labels: Object.keys(statusCount),

            datasets: [{
                data: Object.values(statusCount)
            }]

        }

    });

    cityChart = new Chart(document.getElementById("cityChart"), {

        type: "bar",

        data: {

            labels: Object.keys(cityRevenue),

            datasets: [{

                label: "Revenue",

                data: Object.values(cityRevenue)

            }]

        }

    });

}

function createDriverTable(data) {

    let drivers = {};

    data.forEach(row => {

        if (!drivers[row.driver_id])
            drivers[row.driver_id] = 0;

        drivers[row.driver_id] += Number(row.fare_amount);

    });

    let tbody = document.querySelector("#driverTable tbody");

    tbody.innerHTML = "";

    Object.entries(drivers)
        .sort((a, b) => b[1] - a[1])
        .forEach(driver => {

            tbody.innerHTML += `
            <tr>
                <td>${driver[0]}</td>
                <td>₹${driver[1]}</td>
            </tr>
            `;

        });

}

function createCityRevenueTable(data) {

    let cities = {};

    data.forEach(row => {

        if (!cities[row.city])
            cities[row.city] = 0;

        cities[row.city] += Number(row.fare_amount);

    });

    let tbody = document.querySelector("#cityRevenueTable tbody");

    tbody.innerHTML = "";

    Object.entries(cities)
        .sort((a, b) => b[1] - a[1])
        .forEach(city => {

            tbody.innerHTML += `
            <tr>
                <td>${city[0]}</td>
                <td>₹${city[1]}</td>
            </tr>
            `;

        });

}

function populateCities(data) {

    const cityFilter = document.getElementById("cityFilter");

    cityFilter.innerHTML = `<option value="All">All Cities</option>`;

    let cities = [...new Set(data.map(x => x.city))];

    cities.forEach(city => {

        cityFilter.innerHTML +=
            `<option value="${city}">${city}</option>`;

    });

}

document.getElementById("cityFilter").addEventListener("change", function () {

    let city = this.value;

    let filteredData;

    if (city === "All")
        filteredData = originalData;
    else
        filteredData = originalData.filter(x => x.city === city);

    currentData = filteredData;

    calculateDashboard(filteredData);

    createCharts(filteredData);

    createDriverTable(filteredData);

    createCityRevenueTable(filteredData);

});

document.getElementById("downloadBtn").addEventListener("click", downloadCSV);

function downloadCSV() {

    if (currentData.length === 0) {
        alert("No data available!");
        return;
    }

    let csv = "";

    let headers = Object.keys(currentData[0]);

    csv += headers.join(",") + "\n";

    currentData.forEach(row => {

        csv += headers.map(h => row[h]).join(",") + "\n";

    });

    let blob = new Blob([csv], { type: "text/csv" });

    let url = URL.createObjectURL(blob);

    let a = document.createElement("a");

    a.href = url;

    a.download = "Ride_Report.csv";

    a.click();

    URL.revokeObjectURL(url);

}

document.getElementById("searchDriver").addEventListener("keyup", function () {

    let value = this.value.toLowerCase();

    let rows = document.querySelectorAll("#driverTable tbody tr");

    rows.forEach(row => {

        let driver = row.cells[0].innerText.toLowerCase();

        if(driver.includes(value))
            row.style.display = "";
        else
            row.style.display = "none";

    });

});

const btn = document.getElementById("themeBtn");

btn.addEventListener("click", function(){

    document.body.classList.toggle("dark");

    if(document.body.classList.contains("dark"))
        btn.innerHTML = "☀️ Light Mode";
    else
        btn.innerHTML = "🌙 Dark Mode";

});

document.getElementById("pdfBtn").addEventListener("click", function(){

    const element = document.body;

    html2pdf()
        .set({
            margin: 0.5,
            filename: "Ride_Analytics_Report.pdf",
            image: { type: "jpeg", quality: 1 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
        })
        .from(element)
        .save();

});