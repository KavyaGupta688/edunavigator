const ScrapingService = require('../services/scrapingService');
const logger = require('../utils/logger');

/**
 * Start the scraping service
 */
const startScraping = async () => {
  try {
    logger.info('Starting scraping service...');
    
    const scrapingService = new ScrapingService();
    const results = await scrapingService.runScraping();
    
    logger.info('Scraping completed successfully', {
      exams: results.exams,
      hackathons: results.hackathons,
      internships: results.internships
    });
    
    console.log('✅ Scraping completed successfully!');
    console.log(`📚 Exams: ${results.exams.saved} new, ${results.exams.updated} updated`);
    console.log(`🎯 Hackathons: ${results.hackathons.saved} new, ${results.hackathons.updated} updated`);
    console.log(`💼 Internships: ${results.internships.saved} new, ${results.internships.updated} updated`);
    
  } catch (error) {
    logger.error('Scraping failed', { error: error.message });
    console.error('❌ Scraping failed:', error.message);
    process.exit(1);
  }
};

// Run scraping if this file is executed directly
if (require.main === module) {
  startScraping();
}

module.exports = { startScraping };