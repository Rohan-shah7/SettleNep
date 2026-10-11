use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::{constants::*, error::ErrorCode, state::{Allocation, Settlement}};

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct CreateSettlement<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,
    /// CHECK: funds recipient validated in the handler; may be an uninitialized account
    #[account(mut)]
    pub recipient: UncheckedAccount<'info>,
    #[account(
        init_if_needed,
        payer = sender,
        space = 8 + Settlement::INIT_SPACE,
        seeds = [SETTLEMENT_SEED, sender.key().as_ref(), nonce.to_le_bytes().as_ref()],
        bump
    )]
    pub settlement: Account<'info, Settlement>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_settlement(
    ctx: Context<CreateSettlement>,
    nonce: u64,
    amount: u64,
    reference: [u8; 32],
    allocations: Vec<Allocation>,
) -> Result<()> {
    let sender = ctx.accounts.sender.key();
    let recipient = ctx.accounts.recipient.key();

    require!(
        recipient != system_program::ID && recipient != ctx.accounts.settlement.key(),
        ErrorCode::InvalidRecipient,
    );
    require!(amount > 0, ErrorCode::InvalidAmount);

    let allocation_count = allocations.len();
    require!(allocation_count > 0, ErrorCode::NoAllocations);
    require!(
        allocation_count <= MAX_ALLOCATIONS,
        ErrorCode::TooManyAllocations,
    );

    let mut allocated: u64 = 0;
    for allocation in allocations.iter() {
        allocated = allocated
            .checked_add(allocation.amount)
            .ok_or(ErrorCode::MathOverflow)?;
    }
    require!(allocated == amount, ErrorCode::AllocationMismatch);

    // Re-initialization guard: with `init_if_needed` a repeated attempt with
    // the same sender and nonce must be surfaced as the semantic error.
    let settlement = &mut ctx.accounts.settlement;
    require!(
        settlement.created_at == 0,
        ErrorCode::DuplicateSettlement,
    );

    let clock = Clock::get()?;
    settlement.sender = sender;
    settlement.recipient = recipient;
    settlement.amount = amount;
    settlement.reference = reference;
    settlement.allocation_count = allocation_count as u8;
    settlement.created_at = clock.unix_timestamp;
    settlement.status = SETTLED;
    settlement.nonce = nonce;
    settlement.bump = ctx.bumps.settlement;
    let mut stored = [Allocation {
        purpose: 0,
        amount: 0,
    }; MAX_ALLOCATIONS];
    stored[..allocation_count].copy_from_slice(&allocations);
    settlement.allocations = stored;

    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.sender.to_account_info(),
        to: ctx.accounts.recipient.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(system_program::ID, cpi_accounts);
    system_program::transfer(cpi_ctx, amount)?;

    msg!(
        "Settlement created: sender={}, recipient={}, amount={}, allocations={}, nonce={}",
        sender,
        recipient,
        amount,
        allocation_count,
        nonce,
    );
    Ok(())
}