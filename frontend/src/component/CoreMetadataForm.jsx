import React from 'react';
import { FaBuilding, FaUserTie, FaCalendarAlt } from 'react-icons/fa';
import { MdOutlineSecurity, MdNumbers } from 'react-icons/md';

// Assume these utilities and constants are imported or defined in the main file's scope
// For a multi-file setup, you'd need to export/import them.

// Placeholder for FormInput and COURT_STATIONS (for running the component in isolation)
const FormInput = ({ label, id, name, value, onChange, type = 'text', required = false, error, children, icon: Icon }) => (
    <div className="flex flex-col mb-2"> 
        <label htmlFor={id} className="text-xs font-medium text-gray-700 flex items-center mb-0.5"> 
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
                    className={`w-full p-1.5 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md transition-all duration-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm`}
                />
            )}
        </div>
        {error && <p className="text-red-500 text-xs mt-0.5 italic">{error}</p>}
    </div>
);

const COURT_STATIONS = [
    "Malegaon Court", "Manmad Court", "Nashik City Court", "Niphad Court",
    "Igatpuri Court", "Sinnar Court", "Yeola Court", "Nandgaon Court"
];


const CoreMetadataForm = ({ formData, handleMainFormChange }) => {
    return (
        <div className="bg-indigo-50 p-4 rounded-xl shadow-inner border border-indigo-200 order-2 lg:order-1">
            <h3 className="text-md font-bold text-indigo-800 mb-3 border-b border-indigo-300 pb-1 flex items-center">
                <FaBuilding className="mr-2"/> Core Metadata
            </h3>
            <div className="space-y-1"> 
                
                {/* Court Name Selector */}
                <FormInput label="Court Name" id="courtName" name="courtName" value={formData.courtName} onChange={handleMainFormChange} required icon={FaBuilding}>
                    <select 
                        id="courtName" 
                        name="courtName" 
                        value={formData.courtName} 
                        onChange={handleMainFormChange} 
                        required 
                        className="w-full p-1.5 border border-gray-300 rounded-md transition-all duration-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm appearance-none bg-white"
                    >
                        <option value="">Select Court Name *</option>
                        {COURT_STATIONS.map((court) => <option key={court} value={court}>{court}</option>)}
                    </select>
                </FormInput>
                
                {/* Company Name */}
                <FormInput 
                    label="Company Name" 
                    id="companyName" 
                    name="companyName" 
                    value={formData.companyName} 
                    onChange={handleMainFormChange} 
                    required 
                    icon={FaBuilding} 
                />
                
                {/* Source */}
                <FormInput 
                    label="From Whom Did It Come?" 
                    id="source" 
                    name="source" 
                    value={formData.source} 
                    onChange={handleMainFormChange} 
                    required 
                    icon={FaUserTie} 
                />
                
                {/* Delivery Date */}
                <FormInput 
                    label="Delivery Date" 
                    id="deliveryDate" 
                    name="deliveryDate" 
                    value={formData.deliveryDate} 
                    onChange={handleMainFormChange} 
                    type="date" 
                    required 
                    icon={FaCalendarAlt}
                />
                
                {/* Installation Date */}
                <FormInput 
                    label="Installation Date" 
                    id="installationDate" 
                    name="installationDate" 
                    value={formData.installationDate} 
                    onChange={handleMainFormChange} 
                    type="date" 
                    required 
                    icon={FaCalendarAlt}
                />
                
                {/* Dead Stock Register Sr. No. */}
                <FormInput 
                    label="Dead Stock Register Sr. No." 
                    id="deadStockRegSrNo" 
                    name="deadStockRegSrNo" 
                    value={formData.deadStockRegSrNo} 
                    onChange={handleMainFormChange} 
                    icon={MdOutlineSecurity} 
                />

                {/* Dead Stock Book Page No. */}
                <FormInput 
                    label="Dead Stock Book Page No." 
                    id="deadStockBookPageNo" 
                    name="deadStockBookPageNo" 
                    value={formData.deadStockBookPageNo} 
                    onChange={handleMainFormChange} 
                    icon={MdNumbers}
                />
            </div>
        </div>
    );
};

export default CoreMetadataForm;