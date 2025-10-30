import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
    FaPlus, FaSignOutAlt, FaFilter, FaFileExcel, FaHome, FaUserCircle,
    FaTimesCircle, FaDesktop, FaBuilding, FaUserTie, FaCalendarAlt, FaTrashAlt, FaInfoCircle, FaFileImport // <-- Added FaFileImport
} from 'react-icons/fa';
import { MdOutlineSecurity, MdNumbers } from 'react-icons/md';

// --- Assuming these components/paths are correct ---
import HardwareModal from './HardwareModal';
import HardwareList from './HardwareList';

// --- Constants (Keeping your original court names) ---
export const HARDWARE_OPTIONS = [
    'CPU', 'Monitor', 'Keyboard', 'Mouse', 'LCD', 'Scanner', 'Printer', 'Other'
];
const rawStations = process.env.REACT_APP_COURT_STATIONS || '';
const court_List = rawStations
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

export const COURT_STATIONS = court_List || ''

// [
//     "Malegaon",
//     "Nandgaon",
//     "Satana",
//     "Niphad",
//     "Yeola",
//     "Chandwad",
//     "Pimpalgaon (B)",
//     "Manmad City",
//     "Manmad (Rly)",
//     "Sinnar",
//     "Dindori",
//     "Kalwan",
//     "Nashik-Road",
//     "Vehicle Section",
//     "Malegaon Sessions Division",
//     "Niphad Sessions Division",
//     "Nashik Dist Court"
// ];

// ----------------------------------------------------------------
// --- Utility Components (Refined for Admin Dashboard Look) ---
// ----------------------------------------------------------------

const MessageComponent = ({ message, type }) => {
    if (!message) return null;
    const baseClasses = "py-3 px-6 rounded-xl font-medium text-white mb-4 transition-all duration-300 transform animate-fade-in flex items-center shadow-lg";
    const typeClasses = type === "success" ? "bg-green-500" : "bg-red-600";
    const Icon = type === "success" ? FaDesktop : FaTimesCircle;
    return (
        <div className={`${baseClasses} ${typeClasses}`}>
            <Icon className="mr-3 text-xl"/>
            {message}
        </div>
    );
};

const FormInput = ({ label, id, name, value, onChange, type = 'text', required = false, error, children, icon: Icon, placeholder }) => (
    <div className="flex flex-col mb-4">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 flex items-center mb-1">
            {Icon && <Icon className="mr-2 text-indigo-500 text-sm" />}
            {label} {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
            {children ? children : (
                <input
                    type={type}
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder}
                    className={`w-full p-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm`}
                />
            )}
        </div>
        {error && <p className="text-red-500 text-xs mt-0.5 italic">{error}</p>}
    </div>
);

// --- INFO MODAL COMPONENT (High-end Admin Look) ---
const InfoModal = ({ record, onClose }) => {
    if (!record) return null;

    const metadataFields = [
        { label: "Court Name", value: record.courtName, icon: FaBuilding },
        { label: "Company Name", value: record.companyName, icon: FaBuilding },
        { label: "Source", value: record.source, icon: FaUserTie },
        { label: "Dead Stock Reg. Sr. No.", value: record.deadStockRegSrNo, icon: MdOutlineSecurity },
        { label: "Dead Stock Book Page No.", value: record.deadStockBookPageNo, icon: MdNumbers },
        { label: "Delivery Date", value: record.deliveryDate ? new Date(record.deliveryDate).toLocaleDateString() : 'N/A', icon: FaCalendarAlt },
        { label: "Installation Date", value: record.installationDate ? new Date(record.installationDate).toLocaleDateString() : 'N/A', icon: FaCalendarAlt },
        { label: "Allocated Employee", value: record.employeeAllocated?.fullName || 'N/A', icon: FaUserCircle },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] transform transition-all duration-300 scale-100">

                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h2 className="text-2xl font-extrabold text-indigo-700 flex items-center">
                        <FaInfoCircle className="mr-3 text-xl"/> Hardware Details: <span className="ml-2 text-gray-800 italic font-semibold">{record.hardwareName}</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-600 transition-colors text-2xl p-1 ml-2">
                        <FaTimesCircle />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="bg-blue-50 p-5 rounded-xl shadow-inner border border-blue-200">
                        <h3 className="text-lg font-bold text-blue-800 mb-4 border-b border-blue-300 pb-2">General Information</h3>
                        {metadataFields.map((field, index) => (
                            <div key={index} className="flex items-start mb-3 text-sm">
                                <span className="w-1/2 font-semibold text-gray-700 flex items-center">
                                    <field.icon className="mr-2 text-blue-500 text-base"/> {field.label}:
                                </span>
                                <span className="w-1/2 text-gray-900 font-medium">{field.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gray-100 p-5 rounded-xl shadow-inner border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2 flex items-center">
                            <FaDesktop className="mr-2"/> Hardware Item
                        </h3>
                        <div className="space-y-4">
                            <div className="text-xl font-extrabold text-indigo-700 border-b pb-2">
                                {record.hardwareName}
                            </div>
                            <div className="text-base">
                                <span className="font-semibold text-gray-700">Serial Number:</span>
                                <span className="ml-2 font-mono text-gray-900 bg-gray-200 p-1 rounded text-sm">{record.serialNumber}</span>
                            </div>
                            <p className="text-xs text-gray-500 pt-3 border-t mt-3">
                                Item ID: {record._id}
                                {record.parentId && (<span className="ml-3">Parent Record ID: {record.parentId}</span>)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------
// --- Main Dashboard Component ---
// ----------------------------------------------------------------

const UserDashboard = () => {

    const [user, setUser] = useState(null);
    const [hardwareRecords, setHardwareRecords] = useState([]);
    const [userCourtStation, setUserCourtStation] = useState(null); // <--- NEW STATE

    // 👇️ FIX 1: Ensure initialFormData includes 'company' for multi-item forms
    const initialFormData = {
        _id: null,
        parentId: null,
        courtName: '', companyName: '', deliveryDate: '', installationDate: '',
        deadStockRegSrNo: '', deadStockBookPageNo: '', source: '',
        hardwareItems: [{ hardwareName: '', manualHardwareName: '', serialNumber: '', company: '' }]
    };
    const [formData, setFormData] = useState(initialFormData);

    const [showModal, setShowModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    const [filters, setFilters] = useState({ name: '', court: '', serialNo: '', company: '' });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [serialErrors, setSerialErrors] = useState({});

    const navigate = useNavigate();
    const backend_Url = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };

    const showMessage = (text, type) => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
    };

    useEffect(() => {
        fetchUserData();
        // fetchHardwareRecords();
    }, []);

    // --- Data Fetching ---

 const fetchUserData = async () => {
        try {
            const res = await axios.get(backend_Url + '/api/user/me', config);
            const userData = res.data;
            setUser(userData);
            // 👇️ Set the user's court station
            setUserCourtStation(userData.village); 
            
            // Pass the court station to fetch records
            fetchHardwareRecords(userData.village); 
        } catch (err) {
            console.error('Failed to fetch user data');
            showMessage('Failed to retrieve user information.', 'error');
            // If user fetch fails, treat it as null for Admin fallback or error state
            setUserCourtStation(null); // Ensure state is cleared or set to null
            fetchHardwareRecords(null);
        }
    };
const fetchHardwareRecords = async (userCourt = null) => {
        let apiUrl = '';
        
        // **STRICT FIX:** Only call '/allhardware' if the userCourt is EXPLICITLY the admin court.
        // If userCourt is null/undefined or any other court, we default to the restricted '/hardware' view.
        // However, since we want to restrict the view for all non-admin users, we can be more direct.
        
        if (userCourt === 'Nashik Dist Court') {
            // Admin or broad access view
            apiUrl = backend_Url + '/api/user/allhardware';
        } else {
            // User at a specific court (e.g., Malegaon, Nandgaon, etc.)
            // OR if userCourt is null (in a safety fallback scenario)
            // This is the restricted endpoint that filters by the user's associated court/village (via req.user.id on the backend)
            apiUrl = backend_Url + '/api/user/hardware'; 
        }

        try {
            const res = await axios.get(apiUrl, config);
            setHardwareRecords(res.data);
            
        } catch (err) {
            console.error('API Error:', err.response || err);
            showMessage('Failed to fetch hardware records. Please ensure you have the necessary permissions.', 'error');
        }
    };

    // --- Form/Modal Handlers ---

    const handleMainFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleHardwareItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = formData.hardwareItems.map((item, i) => {
            if (i === index) {
                const updatedItem = { ...item, [name]: value };
                if (name === 'hardwareName' && value !== 'Other') {
                    updatedItem.manualHardwareName = '';
                }
                return updatedItem;
            }
            return item;
        });

        setFormData({ ...formData, hardwareItems: newItems });
    };

    const addHardwareItem = () => {
        setFormData({
            ...formData,
            // Ensure the new item is initialized with a company field
            hardwareItems: [...formData.hardwareItems, { hardwareName: '', manualHardwareName: '', serialNumber: '', company: '' }]
        });
    };

    const removeHardwareItem = (index) => {
        const newItems = formData.hardwareItems.filter((_, i) => i !== index);
        setFormData({ ...formData, hardwareItems: newItems });
    };

    // Consolidated Submit/Update Handler
const handleSubmitHardware = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                // ... (your payload data remains the same)
                courtName: formData.courtName,
                companyName: formData.companyName,
                deliveryDate: formData.deliveryDate,
                installationDate: formData.installationDate,
                deadStockRegSrNo: formData.deadStockRegSrNo,
                deadStockBookPageNo: formData.deadStockBookPageNo,
                source: formData.source,
                employeeAllocated:formData.employeeAllocated,

                hardwareItems: formData.hardwareItems.map(item => ({
                    _id: formData._id ? item._id : undefined,
                    hardwareName: item.hardwareName === 'Other' ? item.manualHardwareName : item.hardwareName,
                    serialNumber: item.serialNumber,
                    company: item.company,
                }))
            };

            if (formData._id && formData.parentId) {
                // EDIT LOGIC (PUT request)
                await axios.put(`${backend_Url}/api/user/hardware/${formData.parentId}`, payload, config);
                showMessage(`Hardware record ID ${formData._id} updated successfully! ✅`, 'success');
            } else {
                // CREATE LOGIC (POST request)
                await axios.post(backend_Url + '/api/user/hardware', payload, config);
                showMessage('Hardware records created successfully! 🎉', 'success');
            }

            setFormData(initialFormData);
            setShowModal(false);
            
            // 👇️ FIX: This line passes the user's court station. 
            // The fetchHardwareRecords function will use this to call the correct API.
            fetchHardwareRecords(userCourtStation); 
            
        } catch (err) {
            const errMsg = err.response?.data?.msg || 'Operation failed. Check server logs.';
            showMessage(errMsg, 'error');
        }
    };


    // --- ACTION HANDLERS (Edit, Delete, Show) ---

    const handleEdit = (id, parentId) => {
        const recordToEdit = hardwareRecords.find(h => h._id === id);

        if (recordToEdit) {
            const item = {
                hardwareName: HARDWARE_OPTIONS.includes(recordToEdit.hardwareName) ? recordToEdit.hardwareName : 'Other',
                manualHardwareName: recordToEdit.company,
                serialNumber: recordToEdit.serialNumber,
                _id: recordToEdit._id,

                // IMPORTANT: Ensure 'company' is mapped for the item edit
                company: recordToEdit.company,
            };

            setFormData({
                _id: recordToEdit._id,
                parentId: recordToEdit.parentId,
                courtName: recordToEdit.courtName,

                companyName: recordToEdit.companyName,

                // Safely handle date strings for input fields
                deliveryDate: recordToEdit.deliveryDate ? recordToEdit.deliveryDate.split('T')[0] : '',
                installationDate: recordToEdit.installationDate ? recordToEdit.installationDate.split('T')[0] : '',

                deadStockRegSrNo: recordToEdit.deadStockRegSrNo || '',
                deadStockBookPageNo: recordToEdit.deadStockBookPageNo || '',
                source: recordToEdit.source,
                hardwareItems: [item],
                employeeAllocated:recordToEdit.employeeAllocated
            });
            setShowModal(true);
        } else {
            showMessage(`Record ID ${id} not found locally.`, 'error');
        }
    };

 const handleDelete = async (id, parentId) => {
        // console.log(id,parentId,"td") // You can remove this console.log after testing
        if (!id || !parentId) {
            showMessage("Error: Missing Item ID or Parent ID for deletion.", 'error');
            return;
        }

        if (window.confirm(`Are you sure you want to permanently delete hardware item ID ${id} from record ${parentId}?`)) {
            try {
                // 1. Perform the DELETE request to the API
                await axios.delete(`${backend_Url}/api/user/hardware/${parentId}/${id}`, config);
                
                // 2. SUCCESS: Update local state (hardwareRecords) immediately
                //    Filter out the record with the matching 'id' from the list
                setHardwareRecords(prevRecords => 
                    prevRecords.filter(record => record._id !== id)
                );

                // 3. Show success message
                showMessage(`Hardware item ID: ${id} deleted successfully. 🗑️`, 'success');
                
                // 4. *** CRITICAL CHANGE: REMOVED THE LINE BELOW ***
                // await fetchHardwareRecords(); // <-- This line is what we are removing to prevent the call to /allhardware
                
            } catch (err) {
                const errMsg = err.response?.data?.msg || 'Failed to delete record. Check API path or server logs.';
                showMessage(errMsg, 'error');
                
                // OPTIONAL: Re-fetch if deletion fails to ensure data consistency
                // If you are confident in your API, you can skip the re-fetch even on error.
                // fetchHardwareRecords(userCourtStation); // or just fetchHardwareRecords();
            }
        }
    };

    const handleShow = (id) => {
        const record = hardwareRecords.find(h => h._id === id);
        if (record) {
            setEditingRecord(record);
            setShowInfoModal(true);
        } else {
            showMessage(`Record ID ${id} not found.`, 'error');
        }
    };

    // 👇️ NEW: Hardware Import Logic
    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array', dateNF: 'yyyy-mm-dd' }); // Add dateNF
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert sheet data to an array of JSON objects
                const jsonRecords = XLSX.utils.sheet_to_json(worksheet);

                if (!jsonRecords.length) {
                    showMessage('The imported file is empty.', 'error');
                    return;
                }

                // Map and Validate Data Structure for your backend
                const preparedPayload = jsonRecords.map(record => {
                    // Determine the correct hardware name (using your existing logic)
                    let hardwareName = record['Hardware Name'] || 'Other';
                    let company = record['Company'] || 'N/A'; // Assuming 'Company' is in your column headers

                    // Clean and format date strings
                    const formatExcelDate = (excelDate) => {
                        if (typeof excelDate === 'number') {
                            // Convert Excel serial date to Date object
                            const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
                            return date.toISOString().split('T')[0];
                        }
                        if (typeof excelDate === 'string') {
                            // If it's already a string, attempt to format it
                            try {
                                return new Date(excelDate).toISOString().split('T')[0];
                            } catch (e) {
                                return '';
                            }
                        }
                        return '';
                    };

                    const deliveryDate = formatExcelDate(record['Delivery Date']);
                    const installationDate = formatExcelDate(record['Installation Date']);

                    // Create a hardware item based on the current record row
                    const hardwareItem = {
                        hardwareName: hardwareName,
                        serialNumber: record['Serial Number'] ? String(record['Serial Number']).trim() : '',
                        company: company,
                    };

                    // Return the main record structure for your API
                    return {
                        courtName: record['Court Name'] || 'Nashik Dist Court', // Default Court if not specified
                        companyName: record['Company Name'] || company, // Use main company name if provided
                        deadStockRegSrNo: record['Dead Stock Sr. No.'] ? String(record['Dead Stock Sr. No.']).trim() : '',
                        deadStockBookPageNo: record['Dead Stock Page No.'] ? String(record['Dead Stock Page No.']).trim() : '',
                        source: record['Source'] || 'Imported Data',
                        deliveryDate: deliveryDate,
                        installationDate: installationDate,
                        employeeAllocated: record['Allocated Employee'] || null, // Assuming this is a name/ID for the backend

                        // The API seems to expect an array of hardware items, even if it's one item per row in the spreadsheet
                        hardwareItems: [hardwareItem]
                    };
                });
                
                // IMPORTANT: This assumes your backend has a BULK import endpoint.
                // If it doesn't, you must replace this POST with a loop of individual POSTs.

                // Using a dedicated batch endpoint (Recommended)
                const res = await axios.post(backend_Url + '/api/user/hardware/batch-import', preparedPayload, config);

                // Assuming the backend returns a success count/message
                showMessage(`Successfully imported ${res.data.count || preparedPayload.length} records! 🎉`, 'success');
                fetchHardwareRecords();

            } catch (err) {
                const errMsg = err.response?.data?.msg || 'Import failed. Check file columns, date formats, or server endpoint.';
                showMessage(`Import Error: ${errMsg}`, 'error');
                console.error('Import Error:', err);
            } finally {
                 // Clear the file input to allow re-uploading the same file
                e.target.value = null;
            }
        };
        reader.readAsArrayBuffer(file);
    };
    // 👆️ END NEW: Hardware Import Logic

    // --- Table Filtering & Export ---

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };

    // 👇️ FIX 2: Corrected and robust filter logic
    const filteredHardware = hardwareRecords.filter((h) => {

        // Safely prepare filter values (default to '' and convert to lower case)
        const filterName = (filters.name || '').toLowerCase();
        const filterSerial = (filters.serialNo || '').toLowerCase();
        const filterCompany = (filters.company || '').toLowerCase();

        // Safely prepare data values (default to '' and convert to lower case)
        const hardwareName = (h.hardwareName || '').toLowerCase();
        const serialNumber = (h.serialNumber || '').toLowerCase();
        const courtName = (h.courtName || '');
        const companyName = (h.company || '').toLowerCase(); // Ensure this matches the field from your API response

        return (
            // 1. Hardware Name Filter (case-insensitive includes)
            (!filterName || hardwareName.includes(filterName)) &&

            // 2. Serial Number Filter (case-insensitive includes)
            (!filterSerial || serialNumber.includes(filterSerial)) &&

            // 3. Court Filter (exact match)
            (!filters.court || courtName === filters.court) &&

            // 4. Company Filter (case-insensitive includes)
            (!filterCompany || companyName.includes(filterCompany))
        );
    });
    // 👆️ End of corrected filter logic

    const exportToExcel = () => {
        if (!filteredHardware.length) {
            showMessage('No data to export. Try clearing your filters.', 'error');
            return;
        }

        const dataToExport = filteredHardware.map(item => ({
            "Hardware Name": item.hardwareName,
            "Serial Number": item.serialNumber,
            "Court Name": item.courtName,
            "Company": item.company,
            "Delivery Date": item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : 'N/A',
            "Installation Date": item.installationDate ? new Date(item.installationDate).toLocaleDateString() : 'N/A',
            "Dead Stock Sr. No.": item.deadStockRegSrNo,
            "Dead Stock Page No.": item.deadStockBookPageNo,
            "Source": item.source,
            "Allocated Employee": item.employeeAllocated || 'N/A',
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hardware Inventory");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(dataBlob, "HardwareInventory_Export.xlsx");
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    // --- Render ---

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">

            {/* Sidebar (Placeholder for full Admin/User consistency) */}
            <div className="hidden md:flex w-64 bg-white border-r border-gray-200 p-6 flex-col shadow-lg">
                <div className="flex items-center mb-8">
                    <FaDesktop className="text-3xl text-indigo-600 mr-3" />
                    <h1 className="text-2xl font-bold">IT Dashboard</h1>
                </div>
                <div className="flex items-center p-4 bg-gray-100 rounded-lg mb-6">
                    <FaUserCircle className="text-4xl text-indigo-600 mr-3" />
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Logged in as</span>
                        <span className="font-semibold text-gray-800">{user?.fullName || 'User'}</span>
                         <span className="font-semibold text-gray-800">{user?.village || 'User'}</span>
                    </div>
                </div>
                <nav className="flex-1 space-y-2">
                    <button
                        className="w-full flex items-center p-3 rounded-lg font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
                    >
                        <FaHome className="mr-4 text-xl" />
                        Inventory View
                    </button>
                    {/* Additional User Nav Links Here */}
                </nav>
                <div className="mt-auto pt-6 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center p-3 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-300 shadow-lg"
                    >
                        <FaSignOutAlt className="mr-2" /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8 sm:p-10">

                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-3 border-b border-gray-200">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900">Hardware Inventory</h1>
                        <p className="text-gray-500 mt-1">Manage and view all hardware assets allocated to this area.</p>
                    </div>

                    <div className="flex space-x-3 mt-4 md:mt-0">
                        <button
                            onClick={() => {
                                setFormData(initialFormData); // Reset form data to create a new record
                                setShowModal(true);
                            }}
                            className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-semibold flex items-center hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-300/50 text-sm"
                        >
                            <FaPlus className="mr-2" /> Add Hardware
                        </button>

                        {/* 👇️ NEW: Import Button with hidden file input */}
                        <label htmlFor="hardware-import-file"
                            className="px-6 py-2 rounded-xl bg-purple-600 text-white font-semibold flex items-center hover:bg-purple-700 transition-all duration-300 shadow-lg shadow-purple-300/50 text-sm cursor-pointer"
                        >
                            <FaFileImport className="mr-2" /> Import Excel
                        </label>
                        <input
                            id="hardware-import-file"
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            className="hidden"
                            onChange={handleImport} // Call the new handler
                        />
                        {/* 👆️ END NEW: Import Button */}

                        <button
                            onClick={exportToExcel}
                            className="px-6 py-2 rounded-xl bg-green-600 text-white font-semibold flex items-center hover:bg-green-700 transition-all duration-300 shadow-lg shadow-green-300/50 text-sm"
                        >
                            <FaFileExcel className="mr-2" /> Export Data
                        </button>
                    </div>
                </header>

                <MessageComponent message={message} type={messageType} />

                {/* Filters Card (Admin-style card) */}
                <div className="bg-white p-4 rounded-xl shadow-xl mb-6 border border-gray-100">
                    <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-700"><FaFilter className="mr-2 text-base text-indigo-600" /> Quick Filters</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                        <FormInput type="text" name="name" placeholder="Hardware Name" label="Item Name" value={filters.name} onChange={handleFilterChange} />
                        <FormInput type="text" name="serialNo" placeholder="Serial No." label="Serial Number" value={filters.serialNo} onChange={handleFilterChange} />
                        <FormInput type="text" name="company" placeholder="Company Name" label="Vendor Company" value={filters.company} onChange={handleFilterChange} />
                        {/* <FormInput label="Court Station" name="court" value={filters.court} onChange={handleFilterChange}>
                            <select value={filters.court} name="court" onChange={handleFilterChange}
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm appearance-none bg-white h-[47px]"
                            >
                                <option value="">All Court Names</option>
                                {COURT_STATIONS.map((court) => (<option key={court} value={court}>{court}</option>))}
                            </select>
                        </FormInput> */}
                    </div>
                </div>

                {/* Table Component */}
                <div className="bg-white p-6 rounded-xl shadow-xl">
                    <HardwareList
                        filteredHardware={filteredHardware}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                        handleShow={handleShow}
                    />
                </div>

                {/* CREATE/EDIT MODAL POPUP (Uses Admin modal design principles) */}
                {showModal && (
                    <HardwareModal
                        user={user}
                        formData={formData}
                        handleMainFormChange={handleMainFormChange}
                        handleHardwareItemChange={handleHardwareItemChange}
                        addHardwareItem={addHardwareItem}
                        removeHardwareItem={removeHardwareItem}
                        handleSubmitHardware={handleSubmitHardware}
                        serialErrors={serialErrors}
                        onClose={() => {
                            setShowModal(false);
                            setFormData(initialFormData);
                        }}
                    />
                )}

                {/* INFO/SHOW MODAL POPUP (Uses the designed InfoModal) */}
                {showInfoModal && (
                    <InfoModal
                        record={editingRecord}
                        onClose={() => setShowInfoModal(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
