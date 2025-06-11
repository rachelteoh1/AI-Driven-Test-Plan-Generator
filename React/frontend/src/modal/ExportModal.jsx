import React from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import exportResults from '../lib/ExportResults'; // adjust path if needed

const ExportModal = ({ open, onClose, testData }) => {
  const handleExport = (format) => {
    exportResults(testData, format);
    onClose(); // Close modal after export
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    p: 4,
    backgroundColor: 'white',
    borderRadius: 2,
    width: 300,
    boxShadow: 24,
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  };

  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: 500,
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>Export As</h3>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </div>
        <Button onClick={() => handleExport('csv')} fullWidth sx={{ mb: 1 }}>CSV</Button>
        <Button onClick={() => handleExport('txt')} fullWidth sx={{ mb: 1 }}>TXT</Button>
        <Button onClick={() => handleExport('json')} fullWidth>JSON</Button>
      </Box>
    </Modal>
  );
};

export default ExportModal;
