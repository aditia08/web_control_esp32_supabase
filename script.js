// --- Supabase Configuration ---
// Replace with your actual Supabase Project URL and Anon/Public Key
const SUPABASE_URL = 'https://iqbiobfohrskpruoeilc.supabase.co';
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxYmlvYmZvaHJza3BydW9laWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM1OTU4NTcsImV4cCI6MjEwOTE3MTg1N30.SOT71UDRQLEmztvVQ5oZ9S1Qy9MEPox8lXqvpCtoBE4';

// Initialize Supabase client
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to fetch latest data for both tables
async function fetchDashboardData() {
    try {
        // 1. Fetch latest 10 records from 'controll' table (Left side)
        const { data: controlData, error: controlError } = await supabase
            .from('controll')
            .select('*')
            .order('id', { ascending: false })
            .limit(10);

        if (controlError) {
            console.error('Error fetching control data:', controlError.message);
        } else {
            populateTable('control-table', controlData, ['id', 'cmd1', 'cmd2', 'cmd3', 'cmd4', 'cmd5', 'time']);
        }

        // 2. Fetch latest 10 records from 'sensor' table (Right side)
        const { data: sensorData, error: sensorError } = await supabase
            .from('sensor')
            .select('*')
            .order('id', { ascending: false })
            .limit(10);

        if (sensorError) {
            console.error('Error fetching sensor data:', sensorError.message);
        } else {
            populateTable('sensor-table', sensorData, ['id', 'sensor1', 'sensor2', 'sensor3', 'sensor4', 'sensor5', 'time']);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

// Helper function to insert rows into tables
function populateTable(tableId, rows, columns) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;

    tbody.innerHTML = ''; // Clear old rows

    if (!rows || rows.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = columns.length;
        td.style.textAlign = 'center';
        td.style.color = '#7f8c8d';
        td.textContent = 'No data available';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    rows.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            let value = row[col];
            
            // Format timestamp neatly
            if (col === 'time' && value) {
                const date = new Date(value);
                value = date.toLocaleTimeString() + ' ' + date.toLocaleDateString();
            }
            
            td.textContent = value !== null && value !== undefined ? value : '-';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// Initial fetch on page load
fetchDashboardData();

// Auto-refresh every 5 seconds (syncs with ESP32 interval)
setInterval(fetchDashboardData, 5000);

// Optional Realtime: Refresh instantly when ESP32 inserts new rows
supabase
    .channel('public-db-changes')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor' }, () => fetchDashboardData())
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'controll' }, () => fetchDashboardData())
    .subscribe();
