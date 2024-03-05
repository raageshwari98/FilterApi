const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Define the base URL of the external API
const externalApiBaseUrl = 'https://api.fillout.com/v1/api/forms';
const bearerToken = 'sk_prod_TfMbARhdgues5AuIosvvdAC9WsA5kXiZlW8HZPaRDlIbCpSpLsXBeZO7dCVZQwHAY3P4VSBPiiC33poZ1tdUj2ljOzdTCCOSpUZ_3912';
// Middleware to check authorization using a bearer token

const checkAuthorization = (req, res, next) => {
    const authorizationHeader = req.headers['authorization'];
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
        
        next(); // Token is valid, proceed to the next middleware
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Endpoint to fetch form responses with filters from external API
app.get('/:formId/filteredResponses', checkAuthorization, async (req, res) => {
    const formId = 'cLZojxk94ous';
    const { filters } = req.query;

    try {
        // Make a GET request to the external API with formId
        const response = await axios.get(`${externalApiBaseUrl}/${formId}/submissions`, {
            headers: {
                'Authorization': `Bearer ${bearerToken}`
            }
        });

        const submissions = response.data.responses; // Get the array of submissions

        // Parse the filters JSON string
        // Parse the filters JSON string
        let parsedFilters;
        try {
            parsedFilters = JSON.parse(filters);
        } catch (error) {
            throw new Error('Invalid filters JSON');
        }

        // Filter the submissions based on the provided filters
        const filteredSubmissions = submissions.filter(submission => {
            // Apply each filter
            return parsedFilters.every(filter => applyFilter(filter, submission));
        });
            
        

        const totalResponses = filteredSubmissions.length;
        const pageCount = Math.ceil(totalResponses / 10); // Assuming 10 responses per page

        res.json({
            responses: filteredSubmissions,
            totalResponses,
            pageCount
        });
    } catch (error) {
        console.error('Error fetching form responses from external API:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Function to apply a single filter to a submission
const applyFilter = (filter, submission) => {
    const { id, condition, value } = filter;
    const question = submission.questions.find(q => q.id === id);
    if (!question) return false;

    switch (condition) {
        case 'equals':
            return question.value === value;
        case 'not_equal':
            return question.value !== value;
        case 'greater_than':
            return new Date(question.value) > new Date(value);
        case 'less_than':
            return new Date(question.value) < new Date(value);
        default:
            return false;
    }
};

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
