// src/controllers/trip.controller.ts
import { Request, Response } from 'express';
import { TripAlgorithmService } from '../services/TripAlgorithmService';

export const planTrip = async (req: Request, res: Response) => {
  try {
    const userRequest = req.body; 
    
    // In a real app, you would query your DB here to get the 'options' 
    // arrays (Flights, Hotels) based on the user's Destination and Date.
    // For MVP, these options might come from your mock data file.
    
    const tripService = new TripAlgorithmService();
    const plans = tripService.generateTripPlans(userRequest);

    if (plans.length === 0) {
       return res.status(200).json({
         success: false,
         message: "Budget too strict!",
         suggestion: "Try increasing budget or reducing duration."
       });
    }

    return res.status(200).json({
      success: true,
      count: plans.length,
      bestPlan: plans[0], // The highest scored plan
      alternatives: plans.slice(1)
    });

  } catch (error) {
    res.status(500).json({ error: 'Algorithm failed' });
  }
};