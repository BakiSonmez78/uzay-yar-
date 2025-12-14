console.log('Require electron result:', require('electron'));
try {
    console.log('App version:', require('electron').app.getVersion());
} catch (e) {
    console.error('Error accessing app:', e.message);
}
