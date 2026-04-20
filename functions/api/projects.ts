// Cloudflare Pages Functions - Backend API
// Este archivo procesará las peticiones en https://tu-sitio.pages.dev/api/projects

export async function onRequestGet(context) {
  // context.env.DB es la base de datos D1 que enlazaste en el panel
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM projects"
    ).all();
    
    // Convertir de DB schema a JSON para el frontend
    const projects = results.map(row => JSON.parse(row.data));
    
    return new Response(JSON.stringify(projects), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    // Si la tabla no existe aún, regresamos arreglo vacío en lugar de un error fatal
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const projects = body.projects; // Esperamos un arreglo completo de proyectos
    
    // Este enfoque borra y reescribe (como un documento) para simplificar
    // En producción se haría proyecto por proyecto, pero esto es un gran punto de partida.
    await context.env.DB.prepare("DELETE FROM projects").run();
    
    // Insertamos todos los proyectos de nuevo
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
