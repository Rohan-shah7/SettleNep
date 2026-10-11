use anchor_lang::prelude::*;

use crate::constants::MAX_ALLOCATIONS;

#[account]
#[derive(Copy, InitSpace)]
pub struct Allocation {
    pub purpose: u8,
    pub amount: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Settlement {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub reference: [u8; 32],
    pub allocations: [Allocation; MAX_ALLOCATIONS],
    pub allocation_count: u8,
    pub created_at: i64,
    pub status: u8,
    pub nonce: u64,
    pub bump: u8,
}