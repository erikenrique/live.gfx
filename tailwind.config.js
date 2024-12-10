module.exports = {
  content: [
    './views/**/*.ejs',
    './public/**/*.html',
    './src/**/*.js',
],
    theme: {
      extend: {
        colors: {
          'preview-on-border': 'red',
          'preview-on-bg': 'gray',
          'on-border': 'red',
          'on-bg': 'red',
          'preview-off-border': 'gray',
          maroon: {
            900: '#2E0E0E', // Dark maroon
            800: '#3F1212', // Slightly lighter maroon
            700: '#501616', // Lighter maroon
          },
        },
      },
    },
    plugins: [],
  };
  