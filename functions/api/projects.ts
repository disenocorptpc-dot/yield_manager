// Cloudflare Pages Functions - Backend API
// Este archivo procesará las peticiones en https://tu-sitio.pages.dev/api/projects

export async function onRequestGet(context) {
  try {
    // Garantizamos que la tabla existe siempre
    await context.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      )
    `).run();

    const { results } = await context.env.DB.prepare(
      "SELECT * FROM projects"
    ).all();
    
    const projects = results.map(row => JSON.parse(row.data));
    
    return new Response(JSON.stringify(projects), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const projects = body.projects; 
    
    // Garantizamos que la tabla existe siempre
    await context.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      )
    `).run();
    
    await context.env.DB.prepare("DELETE FROM projects").run();
    
    for (const proj of projects) {
      await context.env.DB.prepare(
        "INSERT INTO projects (id, data) VALUES (?, ?)"
      ).bind(proj.id, JSON.stringify(proj)).run();
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
