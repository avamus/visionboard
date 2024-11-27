import { createPool } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// Types
interface CategoryScores {
  engagement: number;
  objection_handling: number;
  information_gathering: number;
  program_explanation: number;
  closing_skills: number;
  overall_effectiveness: number;
  overall_performance: number; 
  average_success: number;
}

interface CategoryDescriptions {
  engagement: string;
  objection_handling: string;
  information_gathering: string;
  program_explanation: string;
  closing_skills: string;
  overall_effectiveness: string;
  overall_performance: string;
}

interface CategoryFeedback {
  engagement: string;
  objection_handling: string;
  information_gathering: string;
  program_explanation: string;
  closing_skills: string;
  overall_effectiveness: string;
}

interface CallData {
  user_name: string;
  user_picture_url: string;
  agent_name: string;
  agent_picture_url: string;
  call_recording_url: string;
  call_details: string;
  scores: CategoryScores;
  feedback: CategoryFeedback;
  descriptions: CategoryDescriptions;
}

// GET endpoint
export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');
    
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

const pool = createPool({
  connectionString: process.env.POSTGRES_PRISMA_URL
});

    const { rows } = await pool.sql`
      SELECT *
      FROM call_logs 
      WHERE member_id = ${memberId}
      ORDER BY call_date ASC;
    `;

    const transformedRows = rows.map(row => ({
  id: row.id,
  call_number: row.call_number,
  user_name: row.user_name,
  agent_name: row.agent_name,
  agent_picture_url: row.agent_picture_url,
  call_date: row.call_date,
  call_recording_url: row.call_recording_url,
  call_details: row.call_details,
  scores: {
    engagement: parseFloat(row.engagement_score),
    objection_handling: parseFloat(row.objection_handling_score),
    information_gathering: parseFloat(row.information_gathering_score),
    program_explanation: parseFloat(row.program_explanation_score),
    closing_skills: parseFloat(row.closing_skills_score),
    overall_effectiveness: parseFloat(row.overall_effectiveness_score),
    overall_performance: parseFloat(row.overall_performance),
    average_success: parseFloat(row.average_success_score)
  },
  feedback: {
    engagement: row.engagement_feedback,
    objection_handling: row.objection_handling_feedback,
    information_gathering: row.information_gathering_feedback,
    program_explanation: row.program_explanation_feedback,
    closing_skills: row.closing_skills_feedback,
    overall_effectiveness: row.overall_effectiveness_feedback
  },
  // Add this new section for descriptions
  descriptions: {
    engagement: row.engagement_description,
    objection_handling: row.objection_handling_description,
    information_gathering: row.information_gathering_description,
    program_explanation: row.program_explanation_description,
    closing_skills: row.closing_skills_description,
    overall_effectiveness: row.overall_effectiveness_description,
    overall_performance: row.overall_performance_description
  }
}));

    return NextResponse.json(transformedRows);
  } catch (error) {
    console.error('Error getting call logs:', error);
    return NextResponse.json({ error: 'Failed to get call logs' }, { status: 500 });
  }
}

// POST endpoint
export const POST = async (request: Request) => {
  try {
    const { memberId, callData }: { memberId: string, callData: CallData } = await request.json();
    
    if (!memberId || !callData) {
      return NextResponse.json({ error: 'Member ID and call data required' }, { status: 400 });
    }

    const pool = createPool({
      connectionString: process.env.POSTGRES_PRISMA_URL
    });

    // Get the current highest call number for this member
    const { rows: existingCalls } = await pool.sql`
      SELECT COALESCE(MAX(call_number), 0) as max_call_number
      FROM call_logs
      WHERE member_id = ${memberId};
    `;

    const nextCallNumber = parseInt(existingCalls[0].max_call_number) + 1;

    // Match exact column names from your database table
    const { rows } = await pool.sql`
      INSERT INTO call_logs (
        member_id,
        call_number,
        user_name,
        user_picture_url,
        agent_name,
        agent_picture_url,
        call_recording_url,
        call_details,
        engagement_score,
        objection_handling_score,
        information_gathering_score,
        program_explanation_score,
        closing_skills_score,
        overall_effectiveness_score,
        overall_performance,
        average_success_score,
        engagement_feedback,
        objection_handling_feedback,
        information_gathering_feedback,
        program_explanation_feedback,
        closing_skills_feedback,
        overall_effectiveness_feedback,
        engagement_description,
        objection_handling_description,
        information_gathering_description,
        program_explanation_description,
        closing_skills_description,
        overall_effectiveness_description,
        overall_performance_description
      ) VALUES (
        ${memberId},
        ${nextCallNumber},
        ${callData.user_name},
        ${callData.user_picture_url},
        ${callData.agent_name},
        ${callData.agent_picture_url},
        ${callData.call_recording_url},
        ${callData.call_details},
        ${callData.scores.engagement},
        ${callData.scores.objection_handling},
        ${callData.scores.information_gathering},
        ${callData.scores.program_explanation},
        ${callData.scores.closing_skills},
        ${callData.scores.overall_effectiveness},
        ${callData.scores.overall_performance},
        ${callData.scores.average_success},
        ${callData.feedback.engagement},
        ${callData.feedback.objection_handling},
        ${callData.feedback.information_gathering},
        ${callData.feedback.program_explanation},
        ${callData.feedback.closing_skills},
        ${callData.feedback.overall_effectiveness},
        ${callData.descriptions.engagement},
        ${callData.descriptions.objection_handling},
        ${callData.descriptions.information_gathering},
        ${callData.descriptions.program_explanation},
        ${callData.descriptions.closing_skills},
        ${callData.descriptions.overall_effectiveness},
        ${callData.descriptions.overall_performance}
      )
      RETURNING *;
    `;

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error adding call log:', error);
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return NextResponse.json({ error: 'Failed to add call log' }, { status: 500 });
  }
}

// PUT endpoint to update a call log
export const PUT = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('id');
    const updateData = await request.json();

    if (!callId) {
      return NextResponse.json({ error: 'Call ID required' }, { status: 400 });
    }

    const pool = createPool({
      connectionString: process.env.POSTGRES_PRISMA_URL
    });

    const { rows } = await pool.sql`
      UPDATE call_logs
      SET 
        engagement_score = COALESCE(${updateData.scores?.engagement}, engagement_score),
        objection_handling_score = COALESCE(${updateData.scores?.objection_handling}, objection_handling_score),
        information_gathering_score = COALESCE(${updateData.scores?.information_gathering}, information_gathering_score),
        program_explanation_score = COALESCE(${updateData.scores?.program_explanation}, program_explanation_score),
        closing_skills_score = COALESCE(${updateData.scores?.closing_skills}, closing_skills_score),
        overall_effectiveness_score = COALESCE(${updateData.scores?.overall_effectiveness}, overall_effectiveness_score),
        average_success_score = COALESCE(${updateData.scores?.average_success}, average_success_score),
        engagement_feedback = COALESCE(${updateData.feedback?.engagement}, engagement_feedback),
        objection_handling_feedback = COALESCE(${updateData.feedback?.objection_handling}, objection_handling_feedback),
        information_gathering_feedback = COALESCE(${updateData.feedback?.information_gathering}, information_gathering_feedback),
        program_explanation_feedback = COALESCE(${updateData.feedback?.program_explanation}, program_explanation_feedback),
        closing_skills_feedback = COALESCE(${updateData.feedback?.closing_skills}, closing_skills_feedback),
        overall_effectiveness_feedback = COALESCE(${updateData.feedback?.overall_effectiveness}, overall_effectiveness_feedback)
      WHERE id = ${callId}
      RETURNING *;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating call log:', error);
    return NextResponse.json({ error: 'Failed to update call log' }, { status: 500 });
  }
}

// DELETE endpoint
export const DELETE = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('id');
    
    if (!callId) {
      return NextResponse.json({ error: 'Call ID required' }, { status: 400 });
    }

    const pool = createPool({
      connectionString: process.env.POSTGRES_PRISMA_URL
    });

    const { rows } = await pool.sql`
      DELETE FROM call_logs 
      WHERE id = ${callId}
      RETURNING *;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Call log not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting call log:', error);
    return NextResponse.json({ error: 'Failed to delete call log' }, { status: 500 });
  }
}
