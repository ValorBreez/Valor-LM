# Valor LM - AI-Powered Professional Relationship Strategist

Valor LM is an AI assistant built around a proprietary professional relationship framework that categorizes relationships into 12 types using three dimensions: Desire, Power, and Rapport.

## 🚀 Quick Start

### 1. Set Up Environment Variables

Copy `env_template.txt` to `.env` and fill in your API keys:

```bash
cp env_template.txt .env
```

Edit `.env` with your actual API keys:
- **Supabase**: Get from your Supabase project dashboard
- **OpenAI**: Get from [platform.openai.com](https://platform.openai.com/api-keys)

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase Database

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase_schema.sql` in your Supabase SQL editor
3. Insert the relationship types data (see `supabase_setup.md`)

### 4. Test the Setup

```bash
# Test database connection
npm test

# Test AI functionality (CLI interface)
node cli_test.js
```

## 📁 Project Structure

```
valor-lm/
├── supabase_schema.sql          # Database schema
├── slack_bot_starter.js         # Slack bot implementation
├── cli_test.js                  # CLI testing interface
├── test_supabase.js             # Database connection test
├── training_course_outline.md   # Course structure
├── PROJECT_SUMMARY.md           # Project overview
├── supabase_setup.md           # Setup instructions
├── env_template.txt            # Environment variables template
└── package.json                # Dependencies
```

## 🧪 Testing

### Database Connection Test
```bash
npm test
```

### AI Functionality Test
```bash
node cli_test.js
```

This will prompt you for relationship dimensions and generate AI advice.

### Slack Bot Test (when ready)
```bash
node slack_bot_starter.js
```

## 🔧 Development

### Adding New Relationship Types
Edit the `RELATIONSHIP_TYPES` object in both `slack_bot_starter.js` and `cli_test.js`.

### Modifying AI Prompts
Update the `generateAIAdvice` function in both files.

### Database Schema Changes
Modify `supabase_schema.sql` and run in Supabase SQL editor.

## 📊 Framework Overview

### The 12 Relationship Types

1. **The Leveraged Ally** (High-High-High)
2. **The Reluctant Resource** (High-High-Low)
3. **The Collaborative Partner** (High-Even-High)
4. **The Stalemate** (High-Even-Low)
5. **The Benevolent Patron** (High-Low-High)
6. **The Desperate Seeker** (High-Low-Low)
7. **The Valued Mentor** (Low-High-High)
8. **The Unwanted Authority** (Low-High-Low)
9. **The Trusted Peer** (Low-Even-High)
10. **The Neutral Acquaintance** (Low-Even-Low)
11. **The Supportive Friend** (Low-Low-High)
12. **The Distant Contact** (Low-Low-Low)

### Three Dimensions

- **Desire**: How much you want something from the relationship
- **Power**: Relative power dynamics between parties
- **Rapport**: Level of trust and connection

## 🎯 Next Steps

### Immediate (Week 1)
1. ✅ Set up Supabase database
2. ✅ Test AI functionality
3. 🔄 Create simple web interface
4. 🔄 Test with real scenarios

### Short-term (Month 1)
1. 🔄 Build Slack bot integration
2. 🔄 Develop training course materials
3. 🔄 Create landing page for course
4. 🔄 Launch beta testing

### Medium-term (Month 3-6)
1. 🔄 Enterprise integrations
2. 🔄 Advanced analytics
3. 🔄 Team relationship mapping
4. 🔄 Go-to-market strategy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

**Database Connection Fails**
- Check your `.env` file has correct Supabase credentials
- Verify the schema was run successfully
- Test with `npm test`

**AI Not Working**
- Verify your OpenAI API key is correct
- Check your OpenAI account has credits
- Test with `node cli_test.js`

**Slack Bot Issues**
- Verify all Slack environment variables are set
- Check Slack app permissions
- Test with `node slack_bot_starter.js`

## 📞 Support

For questions or issues:
1. Check the troubleshooting section above
2. Review the setup guides in the docs
3. Create an issue in the repository

---

**Valor LM** - Transforming professional relationships through AI-powered strategy. 