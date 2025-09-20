const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const Exam = require('../models/Exam');
const Opportunity = require('../models/Opportunity');
const UpdateLog = require('../models/UpdateLog');

class ScrapingService {
  constructor() {
    this.userAgent = process.env.SCRAPING_USER_AGENT || 'EduNavigator/1.0';
    this.browser = null;
  }

  /**
   * Initialize browser for scraping
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  /**
   * Close browser
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Scrape exam data from various sources
   */
  async scrapeExams() {
    try {
      console.log('Starting exam scraping...');
      
      const examSources = [
        this.scrapeNTAExams.bind(this),
        this.scrapeJEEExams.bind(this),
        this.scrapeNEETExams.bind(this),
        this.scrapeGATEExams.bind(this)
      ];

      const results = await Promise.allSettled(
        examSources.map(source => source())
      );

      const successfulScrapes = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .flat();

      console.log(`Successfully scraped ${successfulScrapes.length} exams`);
      return successfulScrapes;

    } catch (error) {
      console.error('Error in exam scraping:', error);
      throw error;
    }
  }

  /**
   * Scrape NTA (National Testing Agency) exams
   */
  async scrapeNTAExams() {
    try {
      const response = await axios.get('https://nta.ac.in/', {
        headers: { 'User-Agent': this.userAgent },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const exams = [];

      // Parse NTA exam announcements
      $('.exam-announcement, .exam-card').each((index, element) => {
        const $el = $(element);
        const examName = $el.find('h3, .exam-title').text().trim();
        const examLink = $el.find('a').attr('href');
        
        if (examName && examLink) {
          exams.push({
            exam_name: examName,
            authority: 'NTA',
            website: examLink.startsWith('http') ? examLink : `https://nta.ac.in${examLink}`,
            exam_type: 'government',
            admission_mode: 'entrance_exam', // Default for NTA exams
            source: 'scraper',
            last_updated: new Date()
          });
        }
      });

      return exams;
    } catch (error) {
      console.error('Error scraping NTA exams:', error);
      return [];
    }
  }

  /**
   * Scrape JEE exams
   */
  async scrapeJEEExams() {
    try {
      const response = await axios.get('https://jeemain.nta.nic.in/', {
        headers: { 'User-Agent': this.userAgent },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const exams = [];

      // Look for JEE Main announcements
      $('.announcement, .notification').each((index, element) => {
        const $el = $(element);
        const title = $el.find('h4, .title').text().trim();
        
        if (title.toLowerCase().includes('jee main')) {
          const year = new Date().getFullYear() + 1; // Next year
          
          exams.push({
            exam_name: 'JEE Main',
            year: year,
            authority: 'NTA',
            website: 'https://jeemain.nta.nic.in/',
            exam_type: 'government',
            admission_mode: 'entrance_exam',
            registration_fee: 1000,
            subjects: ['Physics', 'Chemistry', 'Maths'],
            events: [
              {
                event: 'Registration Start',
                date: new Date(`${year}-11-01`)
              },
              {
                event: 'Registration End',
                date: new Date(`${year}-11-30`)
              },
              {
                event: 'Exam Date',
                date: new Date(`${year}-01-15`)
              }
            ],
            source: 'scraper',
            last_updated: new Date()
          });
        }
      });

      return exams;
    } catch (error) {
      console.error('Error scraping JEE exams:', error);
      return [];
    }
  }

  /**
   * Scrape NEET exams
   */
  async scrapeNEETExams() {
    try {
      const response = await axios.get('https://neet.nta.nic.in/', {
        headers: { 'User-Agent': this.userAgent },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const exams = [];

      // Look for NEET announcements
      $('.announcement, .notification').each((index, element) => {
        const $el = $(element);
        const title = $el.find('h4, .title').text().trim();
        
        if (title.toLowerCase().includes('neet')) {
          const year = new Date().getFullYear() + 1;
          
          exams.push({
            exam_name: 'NEET',
            year: year,
            authority: 'NTA',
            website: 'https://neet.nta.nic.in/',
            exam_type: 'government',
            admission_mode: 'entrance_exam',
            registration_fee: 1500,
            subjects: ['Physics', 'Chemistry', 'Biology'],
            events: [
              {
                event: 'Registration Start',
                date: new Date(`${year}-01-01`)
              },
              {
                event: 'Registration End',
                date: new Date(`${year}-03-31`)
              },
              {
                event: 'Exam Date',
                date: new Date(`${year}-05-05`)
              }
            ],
            source: 'scraper',
            last_updated: new Date()
          });
        }
      });

      return exams;
    } catch (error) {
      console.error('Error scraping NEET exams:', error);
      return [];
    }
  }

  /**
   * Scrape GATE exams
   */
  async scrapeGATEExams() {
    try {
      const response = await axios.get('https://gate.iitk.ac.in/', {
        headers: { 'User-Agent': this.userAgent },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const exams = [];

      // Look for GATE announcements
      $('.announcement, .notification').each((index, element) => {
        const $el = $(element);
        const title = $el.find('h4, .title').text().trim();
        
        if (title.toLowerCase().includes('gate')) {
          const year = new Date().getFullYear() + 1;
          
          exams.push({
            exam_name: 'GATE',
            year: year,
            authority: 'IIT',
            website: 'https://gate.iitk.ac.in/',
            exam_type: 'government',
            admission_mode: 'entrance_exam',
            registration_fee: 1500,
            subjects: ['Engineering Mathematics', 'General Aptitude'],
            events: [
              {
                event: 'Registration Start',
                date: new Date(`${year-1}-08-01`)
              },
              {
                event: 'Registration End',
                date: new Date(`${year-1}-09-30`)
              },
              {
                event: 'Exam Date',
                date: new Date(`${year}-02-01`)
              }
            ],
            source: 'scraper',
            last_updated: new Date()
          });
        }
      });

      return exams;
    } catch (error) {
      console.error('Error scraping GATE exams:', error);
      return [];
    }
  }

  /**
   * Scrape hackathon data from various sources
   */
  async scrapeHackathons() {
    try {
      console.log('Starting hackathon scraping...');
      
      const hackathonSources = [
        this.scrapeDevpostHackathons.bind(this),
        this.scrapeHackerEarthHackathons.bind(this),
        this.scrapeMLHHackathons.bind(this)
      ];

      const results = await Promise.allSettled(
        hackathonSources.map(source => source())
      );

      const successfulScrapes = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .flat();

      console.log(`Successfully scraped ${successfulScrapes.length} hackathons`);
      return successfulScrapes;

    } catch (error) {
      console.error('Error in hackathon scraping:', error);
      throw error;
    }
  }

  /**
   * Scrape hackathons from Devpost
   */
  async scrapeDevpostHackathons() {
    try {
      await this.initBrowser();
      const page = await this.browser.newPage();
      
      await page.setUserAgent(this.userAgent);
      await page.goto('https://devpost.com/hackathons', { waitUntil: 'networkidle2' });
      
      const hackathons = await page.evaluate(() => {
        const hackathonElements = document.querySelectorAll('.hackathon-tile');
        const results = [];
        
        hackathonElements.forEach(element => {
          const title = element.querySelector('h3')?.textContent?.trim();
          const organizer = element.querySelector('.organizer')?.textContent?.trim();
          const prize = element.querySelector('.prize')?.textContent?.trim();
          const deadline = element.querySelector('.deadline')?.textContent?.trim();
          const link = element.querySelector('a')?.href;
          
          if (title && link) {
            results.push({
              title,
              organizer: organizer || 'Unknown',
              prize: prize ? parseInt(prize.replace(/[^0-9]/g, '')) : 0,
              deadline: deadline ? new Date(deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              website: link,
              type: 'hackathon',
              mode: 'Online',
              domain: ['General'],
              team_size: '1-4',
              start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
              source: 'scraper',
              last_updated: new Date()
            });
          }
        });
        
        return results;
      });
      
      await page.close();
      return hackathons;
      
    } catch (error) {
      console.error('Error scraping Devpost hackathons:', error);
      return [];
    }
  }

  /**
   * Scrape hackathons from HackerEarth
   */
  async scrapeHackerEarthHackathons() {
    try {
      const response = await axios.get('https://www.hackerearth.com/challenges/', {
        headers: { 'User-Agent': this.userAgent },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const hackathons = [];

      $('.challenge-card').each((index, element) => {
        const $el = $(element);
        const title = $el.find('.challenge-title').text().trim();
        const organizer = $el.find('.challenge-organizer').text().trim();
        const prize = $el.find('.prize-amount').text().trim();
        const deadline = $el.find('.challenge-deadline').text().trim();
        const link = $el.find('a').attr('href');
        
        if (title && link) {
          hackathons.push({
            title,
            organizer: organizer || 'HackerEarth',
            prize: prize ? parseInt(prize.replace(/[^0-9]/g, '')) : 0,
            deadline: deadline ? new Date(deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            website: link.startsWith('http') ? link : `https://www.hackerearth.com${link}`,
            type: 'hackathon',
            mode: 'Online',
            domain: ['General'],
            team_size: '1-4',
            start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            source: 'scraper',
            last_updated: new Date()
          });
        }
      });

      return hackathons;
    } catch (error) {
      console.error('Error scraping HackerEarth hackathons:', error);
      return [];
    }
  }

  /**
   * Scrape hackathons from Major League Hacking
   */
  async scrapeMLHHackathons() {
    try {
      const response = await axios.get('https://mlh.io/seasons/2024/events', {
        headers: { 'User-Agent': this.userAgent },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const hackathons = [];

      $('.event').each((index, element) => {
        const $el = $(element);
        const title = $el.find('.event-title').text().trim();
        const organizer = $el.find('.event-organizer').text().trim();
        const date = $el.find('.event-date').text().trim();
        const link = $el.find('a').attr('href');
        
        if (title && link) {
          hackathons.push({
            title,
            organizer: organizer || 'MLH',
            prize: 0, // MLH events typically don't have cash prizes
            deadline: date ? new Date(date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            website: link.startsWith('http') ? link : `https://mlh.io${link}`,
            type: 'hackathon',
            mode: 'Offline',
            domain: ['General'],
            team_size: '1-4',
            start_date: date ? new Date(date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            end_date: date ? new Date(new Date(date).getTime() + 2 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            source: 'scraper',
            last_updated: new Date()
          });
        }
      });

      return hackathons;
    } catch (error) {
      console.error('Error scraping MLH hackathons:', error);
      return [];
    }
  }

  /**
   * Scrape internship data from various sources
   */
  async scrapeInternships() {
    try {
      console.log('Starting internship scraping...');
      
      const internshipSources = [
        this.scrapeLinkedInInternships.bind(this),
        this.scrapeInternshalaInternships.bind(this),
        this.scrapeAngelListInternships.bind(this)
      ];

      const results = await Promise.allSettled(
        internshipSources.map(source => source())
      );

      const successfulScrapes = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value)
        .flat();

      console.log(`Successfully scraped ${successfulScrapes.length} internships`);
      return successfulScrapes;

    } catch (error) {
      console.error('Error in internship scraping:', error);
      throw error;
    }
  }

  /**
   * Scrape internships from LinkedIn (limited due to anti-scraping measures)
   */
  async scrapeLinkedInInternships() {
    try {
      // Note: LinkedIn has strict anti-scraping measures
      // This is a simplified example - in production, you'd use their API
      const internships = [
        {
          title: 'Software Engineering Intern',
          company: 'Google India',
          role: 'Software Engineering Intern',
          degree_required: ['B.Tech', 'M.Tech'],
          year_of_study: [3, 4],
          location: 'Bangalore',
          mode: 'Hybrid',
          stipend: 40000,
          duration: '3 months',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          apply_link: 'https://careers.google.com/jobs/',
          type: 'internship',
          skills_required: ['JavaScript', 'React', 'Node.js'],
          source: 'scraper',
          last_updated: new Date()
        }
      ];

      return internships;
    } catch (error) {
      console.error('Error scraping LinkedIn internships:', error);
      return [];
    }
  }

  /**
   * Scrape internships from Internshala
   */
  async scrapeInternshalaInternships() {
    try {
      const response = await axios.get('https://internshala.com/internships/', {
        headers: { 'User-Agent': this.userAgent },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const internships = [];

      $('.internship_meta').each((index, element) => {
        const $el = $(element);
        const title = $el.find('.company_name').text().trim();
        const company = $el.find('.company_name').text().trim();
        const stipend = $el.find('.stipend').text().trim();
        const duration = $el.find('.duration').text().trim();
        const link = $el.find('a').attr('href');
        
        if (title && company && link) {
          internships.push({
            title,
            company,
            role: title,
            degree_required: ['B.Tech', 'B.Sc', 'BBA'],
            year_of_study: [2, 3, 4],
            location: 'Multiple',
            mode: 'Hybrid',
            stipend: stipend ? parseInt(stipend.replace(/[^0-9]/g, '')) : 0,
            duration: duration || '2-3 months',
            deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            apply_link: link.startsWith('http') ? link : `https://internshala.com${link}`,
            type: 'internship',
            skills_required: ['General'],
            source: 'scraper',
            last_updated: new Date()
          });
        }
      });

      return internships;
    } catch (error) {
      console.error('Error scraping Internshala internships:', error);
      return [];
    }
  }

  /**
   * Scrape internships from AngelList
   */
  async scrapeAngelListInternships() {
    try {
      // AngelList (now Wellfound) has changed their structure
      // This is a placeholder for the scraping logic
      const internships = [
        {
          title: 'Product Intern',
          company: 'StartupXYZ',
          role: 'Product Intern',
          degree_required: ['B.Tech', 'MBA'],
          year_of_study: [3, 4],
          location: 'Mumbai',
          mode: 'Remote',
          stipend: 25000,
          duration: '6 months',
          deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          apply_link: 'https://wellfound.com/',
          type: 'internship',
          skills_required: ['Product Management', 'Analytics'],
          source: 'scraper',
          last_updated: new Date()
        }
      ];

      return internships;
    } catch (error) {
      console.error('Error scraping AngelList internships:', error);
      return [];
    }
  }

  /**
   * Save scraped data to database
   * @param {Array} items - Array of scraped items
   * @param {string} type - 'exam', 'hackathon', or 'internship'
   */
  async saveScrapedData(items, type) {
    try {
      let savedCount = 0;
      let updatedCount = 0;

      for (const item of items) {
        try {
          if (type === 'exam') {
            const existingExam = await Exam.findOne({
              exam_name: item.exam_name,
              year: item.year || new Date().getFullYear()
            });

            if (existingExam) {
              // Update existing exam
              await Exam.findByIdAndUpdate(existingExam._id, {
                ...item,
                last_updated: new Date()
              });
              updatedCount++;
            } else {
              // Create new exam
              await Exam.create(item);
              savedCount++;
            }
          } else if (type === 'hackathon' || type === 'internship') {
            const existingOpportunity = await Opportunity.findOne({
              title: item.title,
              website: item.website
            });

            if (existingOpportunity) {
              // Update existing opportunity
              await Opportunity.findByIdAndUpdate(existingOpportunity._id, {
                ...item,
                last_updated: new Date()
              });
              updatedCount++;
            } else {
              // Create new opportunity
              await Opportunity.create(item);
              savedCount++;
            }
          }
        } catch (error) {
          console.error(`Error saving item ${item.title}:`, error);
        }
      }

      console.log(`Saved ${savedCount} new items, updated ${updatedCount} existing items`);
      return { saved: savedCount, updated: updatedCount };
    } catch (error) {
      console.error('Error saving scraped data:', error);
      throw error;
    }
  }

  /**
   * Run complete scraping process
   */
  async runScraping() {
    try {
      console.log('Starting complete scraping process...');
      
      const [exams, hackathons, internships] = await Promise.all([
        this.scrapeExams(),
        this.scrapeHackathons(),
        this.scrapeInternships()
      ]);

      const [examResults, hackathonResults, internshipResults] = await Promise.all([
        this.saveScrapedData(exams, 'exam'),
        this.saveScrapedData(hackathons, 'hackathon'),
        this.saveScrapedData(internships, 'internship')
      ]);

      console.log('Scraping completed successfully');
      return {
        exams: examResults,
        hackathons: hackathonResults,
        internships: internshipResults
      };
    } catch (error) {
      console.error('Error in complete scraping process:', error);
      throw error;
    } finally {
      await this.closeBrowser();
    }
  }
}

module.exports = ScrapingService;