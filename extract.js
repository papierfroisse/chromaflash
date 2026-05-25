const fs = require('fs');
const html = fs.readFileSync('pages/flash.html', 'utf8');
const start = html.indexOf('<script type="module">') + 22;
const end = html.lastIndexOf('</script>');
const script = html.substring(start, end);
fs.writeFileSync('test_flash.mjs', script);
