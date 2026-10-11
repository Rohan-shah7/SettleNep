use anchor_lang::prelude::*;

#[constant]
pub const SETTLEMENT_SEED: &[u8] = b"settlement";

pub const MAX_ALLOCATIONS: usize = 8;

#[constant]
pub const INITIALIZED: u8 = 0;
#[constant]
pub const SETTLED: u8 = 1;
#[constant]
pub const CANCELLED: u8 = 2;

#[constant]
pub const PURPOSE_FAMILY: u8 = 0;
#[constant]
pub const PURPOSE_EDUCATION: u8 = 1;
#[constant]
pub const PURPOSE_SAVINGS: u8 = 2;
#[constant]
pub const PURPOSE_EMERGENCY: u8 = 3;
#[constant]
pub const PURPOSE_OTHER: u8 = 4;