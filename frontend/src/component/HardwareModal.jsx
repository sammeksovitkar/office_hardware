import React from 'react';
import { FaPlus, FaTimesCircle, FaDesktop, FaTrashAlt } from 'react-icons/fa';
import { MdNumbers, MdAddBox } from 'react-icons/md';
import CoreMetadataForm from './CoreMetadataForm'; // Import the metadata component

// --- Constants (Re-defined for context, usually imported) ---
const HARDWARE_OPTIONS = [
    'CPU', 'Monitor', 'Keyboard', 'Mouse', 'LCD', 'Scanner', 'Printer', 'Other'
];

// --- Utility Components (Re-defined for context, usually imported) ---
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

const FormMultiItem = ({ index, item, onChange, onRemove, serialErrors }) => {
    const isOther = item.hardwareName === 'Other';
    
    return (
        <div className="flex space-x-2 mb-3 items-end bg-white p-3 rounded-lg shadow-md border border-gray-100">
            {/* Hardware Name Selector */}
            <div className="flex-1">
                <FormInput label="Hardware Type" id={`hardwareType-${index}`} required icon={FaDesktop}>
                    <select
                        name="hardwareName"
                        value={item.hardwareName}
                        onChange={(e) => onChange(index, e)}
                        required
                        className="w-full p-1.5 border border-gray-300 rounded-md shadow-sm text-sm appearance-none bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="">Select Hardware</option>
                        {HARDWARE_OPTIONS.map((option) => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </FormInput>
            </div>

            {/* Manual Hardware Name Input (if 'Other' is selected) */}
            {isOther && (
                <div className="flex-1">
                    <FormInput 
                        label="Specify Hardware" 
                        id={`manualName-${index}`} 
                        name="manualHardwareName" 
                        value={item.manualHardwareName || ''} 
                        onChange={(e) => onChange(index, e)} 
                        required={isOther}
                        icon={FaDesktop}
                    />
                </div>
            )}

            {/* Serial Number Input */}
            <div className="flex-1">
                <FormInput 
                    label="Serial Number" 
                    id={`serialNumber-${index}`} 
                    name="serialNumber" 
                    value={item.serialNumber} 
                    onChange={(e) => onChange(index, e)} 
                    required 
                    error={serialErrors[index]} 
                    icon={MdNumbers}
                />
            </div>

            {/* Remove Button */}
            <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-2.5 h-full bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors self-end"
                title="Remove Item"
            >
                <FaTrashAlt className="text-sm" />
            </button>
        </div>
    );
};
// --- End Utility Components ---

const HardwareModal = ({ 
    formData, 
    handleMainFormChange, 
    handleHardwareItemChange, 
    addHardwareItem, 
    removeHardwareItem, 
    handleSubmitHardware,
    serialErrors,
    onClose 
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] transform transition-all duration-300 scale-100"> 
                
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-4 border-b pb-3">
                    <h2 className="text-2xl font-extrabold text-indigo-700 flex items-center pt-1">
                        <FaPlus className="mr-3 text-xl"/> Create New Hardware Records
                    </h2>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-3 items-center">
                        <button 
                            type="submit" 
                            form="hardwareForm"
                            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-xl shadow-indigo-400/70 text-sm disabled:bg-indigo-400 disabled:shadow-none"
                        >
                            <FaPlus className="inline mr-2 text-xs"/> **Submit Records**
                        </button>

                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-400 transition-colors shadow-md text-sm border border-gray-400"
                        >
                            Cancel
                        </button>
                        
                        <button onClick={onClose} className="text-gray-400 hover:text-red-600 transition-colors text-xl p-1 ml-2">
                            <FaTimesCircle />
                        </button>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmitHardware} id="hardwareForm">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> 
                        
                        {/* Column 1: Core Metadata (NEW COMPONENT) */}
                        <CoreMetadataForm 
                            formData={formData}
                            handleMainFormChange={handleMainFormChange}
                        />
                        
                        {/* Column 2: Dynamic Hardware Items */}
                        <div className="bg-gray-100 p-4 rounded-xl shadow-inner border border-gray-200 order-1 lg:order-2 max-h-[70vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-3 border-b border-gray-300 pb-1">
                                <h3 className="text-md font-bold text-gray-800 flex items-center"><MdAddBox className="mr-2"/> Hardware Items</h3>
                                <button
                                    type="button"
                                    onClick={addHardwareItem}
                                    className="px-3 py-1 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors flex items-center shadow-md"
                                >
                                    <FaPlus className="mr-1 text-xs"/> Add Item
                                </button>
                            </div>
                            
                            {formData.hardwareItems.map((item, index) => (
                                <FormMultiItem
                                    key={index}
                                    index={index}
                                    item={item}
                                    onChange={handleHardwareItemChange}
                                    onRemove={removeHardwareItem}
                                    serialErrors={serialErrors}
                                />
                            ))}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HardwareModal;