import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const data = await req.json();

    // Use service role to bypass any RLS/permission issues on entity create
    const profile = await base44.asServiceRole.entities.ProfessionalProfile.create(data);

    return Response.json({ profile });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});