pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("GFqpc53KGyUi1BGraoZxVCczM6iUCkRQdB8HfnBiH9RZ");

#[program]
pub mod settlenep {
    use super::*;

    pub fn create_settlement(
        ctx: Context<CreateSettlement>,
        nonce: u64,
        amount: u64,
        reference: [u8; 32],
        allocations: Vec<Allocation>,
    ) -> Result<()> {
        crate::instructions::create_settlement::handle_create_settlement(
            ctx,
            nonce,
            amount,
            reference,
            allocations,
        )
    }
}