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
    
    const deleteStmt = context.env.DB.prepare("DELETE FROM projects");
    const insertStmt = context.env.DB.prepare("INSERT OR REPLACE INTO projects (id, data) VALUES (?, ?)");
    
    const stmts = [deleteStmt];
    
    // Deduplicar proyectos por si el frontend envió accidentalmente dos con el mismo ID
    const uniqueProjects = new Map();
    for (const proj of projects) {
      if (proj && proj.id) {
        uniqueProjects.set(proj.id, proj);
      }
    }
    
    for (const proj of uniqueProjects.values()) {
      stmts.push(insertStmt.bind(proj.id, JSON.stringify(proj)));
    }
    
    // Ejecutar todo como una transacción atómica
    await context.env.DB.batch(stmts);
    
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
