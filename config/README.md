# Configuration Directory

This directory contains all configuration files for the WiFi-Radar project.

## Files

### `.env.example`
Template for environment variables. Copy to `.env` and customize:
```bash
cp config/.env.example .env
```

### `requirements.txt`
Python package dependencies. Install with:
```bash
pip install -r config/requirements.txt
```

## Configuration Guidelines

### Environment Variables

**Development:**
- Use `.env` file (not tracked in git)
- Keep sensitive keys private
- Use defaults for local testing

**Production:**
- Use environment variables directly
- Never commit secrets
- Use secure key management

### Dependencies

**Keep versions pinned for reproducibility:**
- Core packages: Exact versions
- Supporting packages: Minimum versions
- Development tools: Latest compatible

**Update dependencies:**
```bash
# Check outdated packages
pip list --outdated

# Update specific package
pip install --upgrade package-name

# Regenerate requirements
pip freeze > config/requirements.txt
```

## Security Notes

- **Never commit** `.env` files
- **Never commit** API keys or secrets
- **Always use** `.env.example` as template
- **Review** dependencies for security vulnerabilities
