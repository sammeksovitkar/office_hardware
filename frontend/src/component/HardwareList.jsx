import React from 'react';
import { FaEdit, FaTrashAlt, FaEye } from 'react-icons/fa';

const HardwareList = ({ filteredHardware, handleEdit, handleDelete, handleShow }) => {
    
    // Define the table headers for easy maintenance
    const tableHeaders = [
        "Name", "Court", "Serial No.", "Company", 
        "Allocated Emp.", "Delivery Date", "Install Date", 
        "D.S. Reg Sr.", "D.S. Page No.", "Source", "Actions"
    ];

    return (
        <div className="bg-white rounded-xl shadow-xl p-0 border border-gray-100">
            {/* 1. Container for Horizontal Scroll (if needed) and Fixed Header */}
            <div className="overflow-x-auto"> 
                <table className="min-w-full divide-y divide-gray-200 table-auto"> 
                    {/* Table Header: Sticky to remain visible during vertical scroll */}
                    <thead className="bg-indigo-50 sticky top-0 z-20 shadow-md">
                        <tr>
                            {tableHeaders.map(header => (
                                <th key={header} className="px-3 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                </table>
            </div>

            {/* 👇️ 2. CRITICAL SCROLL CONTAINER: Only the body scrolls vertically */}
            <div 
                className="overflow-x-auto overflow-y-auto" 
                // Adjusting the maximum height. 
                // This value (100vh - 350px) is an estimate based on your dashboard layout (header + filters + padding).
                // You may need to fine-tune '350px' depending on your exact screen size and component heights.
                style={{ maxHeight: "calc(100vh - 350px)" }} 
            > 
                <table className="min-w-full divide-y divide-gray-100 table-auto"> 
                    
                    {/* Table Body */}
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredHardware.length > 0 ? (
                            filteredHardware.map(hardware => (
                                <tr key={hardware._id} className="hover:bg-indigo-50 transition-colors duration-200">
                                    <td className="px-3 py-3 text-xs text-gray-800 truncate font-medium max-w-[120px]">{hardware.hardwareName}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[100px]">{hardware.courtName}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 font-mono">{hardware.serialNumber}</td>
                                    {/* Using companyName as it aligns with the filter, falling back to company */}
                                    <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[100px]">{hardware.companyName || hardware.company}</td>
                                    <td className="px-3 py-3 text-xs text-indigo-600 truncate max-w-[100px] font-semibold">{hardware.employeeAllocated || 'N/A'}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 whitespace-nowrap">{hardware.deliveryDate ? new Date(hardware.deliveryDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 whitespace-nowrap">{hardware.installationDate ? new Date(hardware.installationDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[100px]">{hardware.deadStockRegSrNo}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[100px]">{hardware.deadStockBookPageNo}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[120px]">{hardware.source}</td>
                                    
                                    {/* Action Buttons */}
                                    <td className="px-3 py-3 text-sm text-gray-800 whitespace-nowrap">
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={() => handleShow(hardware._id)}
                                                className="p-1.5 text-blue-600 hover:text-blue-800 transition-colors rounded-full bg-blue-100"
                                                title="View Details"
                                            >
                                                <FaEye className="text-xs" />
                                            </button>
                                            <button 
                                                onClick={() => handleEdit(hardware._id, hardware.parentId)}
                                                className="p-1.5 text-green-600 hover:text-green-800 transition-colors rounded-full bg-green-100"
                                                title="Edit Record"
                                            >
                                                <FaEdit className="text-xs" />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(hardware._id, hardware.parentId)}
                                                className="p-1.5 text-red-600 hover:text-red-800 transition-colors rounded-full bg-red-100"
                                                title="Delete Record"
                                            >
                                                <FaTrashAlt className="text-xs" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                {/* colspan must match the number of columns (11) */}
                                <td colSpan={11} className="text-center py-8 text-lg text-gray-500 font-medium">
                                    No hardware records found matching the current filters. 😔
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HardwareList;
