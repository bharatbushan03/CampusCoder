const fs = require('fs');
const path = require('path');

async function runLighthouseAudit() {
  console.log('Starting Lighthouse audit for DSA event page...');
  
  const url = 'http://localhost:3000/events/dsa-7-days-challenge-2026';
  const outputDir = path.join(__dirname, '..', 'qa-screenshots');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Dynamically import lighthouse and chrome-launcher
  const { default: lighthouse } = await import('lighthouse');
  const chromeLauncher = await import('chrome-launcher');
  
  const chrome = await chromeLauncher.launch({ 
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'] 
  });
  
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };
  
  try {
    console.log(`Auditing ${url}...`);
    const runnerResult = await lighthouse(url, options);
    
    // Save HTML report
    const reportHtml = runnerResult.report;
    const htmlReportPath = path.join(outputDir, 'lighthouse-report.html');
    fs.writeFileSync(htmlReportPath, reportHtml);
    console.log(`HTML report saved to: ${htmlReportPath}`);
    
    // Extract scores
    const { categories } = runnerResult.lhr;
    const scores = {
      performance: Math.round(categories.performance.score * 100),
      accessibility: Math.round(categories.accessibility.score * 100),
      'best-practices': Math.round(categories['best-practices'].score * 100),
      seo: Math.round(categories.seo.score * 100),
    };
    
    console.log('\n=== Lighthouse Scores ===');
    console.log(`Performance: ${scores.performance}/100`);
    console.log(`Accessibility: ${scores.accessibility}/100`);
    console.log(`Best Practices: ${scores['best-practices']}/100`);
    console.log(`SEO: ${scores.seo}/100`);
    
    // Save scores as JSON
    const scoresPath = path.join(outputDir, 'lighthouse-scores.json');
    fs.writeFileSync(scoresPath, JSON.stringify(scores, null, 2));
    console.log(`Scores saved to: ${scoresPath}`);
    
    // Check for Core Web Vitals
    const audits = runnerResult.lhr.audits;
    const coreWebVitals = {
      'largest-contentful-paint': audits['largest-contentful-paint']?.displayValue || 'N/A',
      'cumulative-layout-shift': audits['cumulative-layout-shift']?.displayValue || 'N/A',
      'first-contentful-paint': audits['first-contentful-paint']?.displayValue || 'N/A',
      'total-blocking-time': audits['total-blocking-time']?.displayValue || 'N/A',
    };
    
    console.log('\n=== Core Web Vitals ===');
    Object.entries(coreWebVitals).forEach(([metric, value]) => {
      console.log(`${metric}: ${value}`);
    });
    
    // Save Core Web Vitals
    const cwvPath = path.join(outputDir, 'core-web-vitals.json');
    fs.writeFileSync(cwvPath, JSON.stringify(coreWebVitals, null, 2));
    
    // Generate summary
    const summary = {
      timestamp: new Date().toISOString(),
      url,
      scores,
      coreWebVitals,
      recommendations: []
    };
    
    // Add recommendations based on scores
    if (scores.performance < 90) {
      summary.recommendations.push('Optimize performance: Consider lazy loading images, reducing JavaScript bundle size, and optimizing CSS.');
    }
    
    if (scores.accessibility < 90) {
      summary.recommendations.push('Improve accessibility: Ensure all interactive elements have proper ARIA labels and color contrast meets WCAG guidelines.');
    }
    
    if (scores.seo < 90) {
      summary.recommendations.push('Enhance SEO: Check meta tags, structured data, and ensure page is crawlable.');
    }
    
    const summaryPath = path.join(outputDir, 'lighthouse-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\nSummary saved to: ${summaryPath}`);
    
    // Print recommendations
    if (summary.recommendations.length > 0) {
      console.log('\n=== Recommendations ===');
      summary.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
    
    return { scores, coreWebVitals, summary };
    
  } catch (error) {
    console.error('Lighthouse audit failed:', error);
    throw error;
  } finally {
    await chrome.kill();
  }
}

// Run the audit
runLighthouseAudit().catch(console.error);