# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Docker

### Production Build

Build and run the Docker image for production:

```bash
# Build the image
docker build -t nuxt-app .

# Run the container
docker run -p 3000:3000 nuxt-app
```

### Using Docker Compose

For production:

```bash
docker-compose up --build
```

For development with hot reload:

```bash
docker-compose --profile dev up --build
```

### Environment Variables

You can override environment variables when running the container:

```bash
docker run -p 3000:3000 -e API_BASE=https://api.example.com nuxt-app
```

### Multi-stage Build Benefits

- **Layer Caching**: Dependencies are cached separately from source code
- **Optimized Size**: Production image only contains necessary files
- **Security**: Runs as non-root user
- **Performance**: Uses Bun for faster builds and runtime
